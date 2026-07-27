import { PaymentRepository } from "@/repositories/PaymentRepository";
import { RegistrationRepository } from "@/repositories/RegistrationRepository";
import { WorkshopRepository } from "@/repositories/WorkshopRepository";
import { createRazorpayOrder, getPublicRazorpayKeyId, verifyCheckoutSignature } from "@/lib/payments/razorpay";
import type { PaymentDocument } from "@/models/Payment";
import { NotFoundError } from "@/errors/NotFoundError";
import { ConflictError } from "@/errors/ConflictError";
import { ValidationError } from "@/errors/ValidationError";
import { DatabaseError } from "@/errors/DatabaseError";
import type { VerifyPaymentInput } from "@/validators/payment.schema";

export interface PaymentOrderContext {
  razorpayOrderId: string;
  razorpayKeyId: string;
  /** Paise, matching Razorpay's own convention — this is what Checkout's `amount` option expects directly. */
  amount: number;
  currency: string;
  registrationNumber: string;
  registrantName: string;
  registrantEmail: string;
  registrantPhone: string;
  workshopTitle: string;
  workshopDate: Date;
}

export interface PaymentResultContext {
  registrationNumber: string;
  workshopTitle: string;
  workshopDate: Date;
  /** Paise — divide by 100 for display. */
  amount: number;
  gatewayPaymentId: string;
  paidAt: Date;
  whatsappCommunityLink?: string;
}

/** Shape Razorpay sends to the webhook endpoint — loosely typed since only these fields are used. */
export interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id: string;
        order_id: string;
        status?: string;
      };
    };
  };
}

/**
 * Business-logic layer for payments. This is where every rule from the
 * Phase 8 spec lives:
 *   - a registration that's already paid can't be charged again
 *   - a free workshop never needs a Razorpay order
 *   - reloading the payment page reuses the existing pending order instead
 *     of creating a new one every time (idempotency)
 *   - the frontend's reported payment success is NEVER trusted directly —
 *     `verifyAndCapture` is the only path that marks a registration paid,
 *     and it always re-derives the signature server-side first
 *   - the webhook handler is idempotent against the same checkout-return
 *     call already having finalized the payment (and vice versa)
 */
export class PaymentService {
  constructor(
    protected readonly paymentRepository: PaymentRepository = new PaymentRepository(),
    protected readonly registrationRepository: RegistrationRepository = new RegistrationRepository(),
    protected readonly workshopRepository: WorkshopRepository = new WorkshopRepository()
  ) {}

  async createOrGetOrder(registrationId: string): Promise<PaymentOrderContext> {
    const registration = await this.registrationRepository.findById(registrationId);
    if (!registration) {
      throw new NotFoundError(`Registration "${registrationId}" not found`);
    }

    const workshop = await this.workshopRepository.findById(registration.workshopId.toString());
    if (!workshop) {
      throw new NotFoundError("Workshop for this registration no longer exists");
    }

    if (registration.paymentStatus === "paid") {
      throw new ConflictError("This registration has already been paid for");
    }

    if (workshop.price <= 0) {
      throw new ConflictError("This workshop does not require payment");
    }

    const existingPending = await this.paymentRepository.findLatestPendingByRegistrationId(registrationId);
    if (existingPending) {
      return this.toOrderContext(existingPending, registration.registrationNumber, registration.name, registration.email, registration.phone, workshop.title, workshop.date);
    }

    const order = await createRazorpayOrder({
      amountInRupees: workshop.price,
      receipt: registration.registrationNumber,
      notes: { registrationId, workshopId: workshop._id.toString() },
    });

    const payment = await this.paymentRepository.create({
      registrationId: registration._id,
      workshopId: workshop._id,
      amount: order.amount, // paise — matches Razorpay's own representation; divide by 100 wherever this is displayed
      currency: order.currency,
      gateway: "razorpay",
      gatewayOrderId: order.id,
      status: "pending",
    });

    if (registration.paymentStatus === "n/a") {
      await this.registrationRepository.updateById(registrationId, { paymentStatus: "pending" });
    }

    return this.toOrderContext(payment, registration.registrationNumber, registration.name, registration.email, registration.phone, workshop.title, workshop.date);
  }

  private toOrderContext(
    payment: PaymentDocument,
    registrationNumber: string,
    registrantName: string,
    registrantEmail: string,
    registrantPhone: string,
    workshopTitle: string,
    workshopDate: Date
  ): PaymentOrderContext {
    return {
      razorpayOrderId: payment.gatewayOrderId,
      razorpayKeyId: getPublicRazorpayKeyId(),
      amount: payment.amount,
      currency: payment.currency,
      registrationNumber,
      registrantName,
      registrantEmail,
      registrantPhone,
      workshopTitle,
      workshopDate,
    };
  }

  async verifyAndCapture(input: VerifyPaymentInput): Promise<PaymentResultContext> {
    const { registrationId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    const isValid = verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      throw new ValidationError("Payment verification failed — signature mismatch");
    }

    const payment = await this.paymentRepository.findByGatewayOrderId(razorpayOrderId);
    if (!payment || payment.registrationId.toString() !== registrationId) {
      throw new NotFoundError("Payment order not found for this registration");
    }

    // Idempotent: the webhook may have already finalized this exact payment.
    if (payment.status === "paid") {
      return this.buildResultContext(payment);
    }

    const updatedPayment = await this.paymentRepository.updateById(payment._id.toString(), {
      gatewayPaymentId: razorpayPaymentId,
      gatewaySignature: razorpaySignature,
      status: "paid",
      paidAt: new Date(),
    });
    if (!updatedPayment) {
      throw new DatabaseError("Failed to update payment record");
    }

    await this.registrationRepository.updateById(registrationId, { paymentStatus: "paid", status: "confirmed" });

    return this.buildResultContext(updatedPayment);
  }

  private async buildResultContext(payment: PaymentDocument): Promise<PaymentResultContext> {
    const registration = await this.registrationRepository.findById(payment.registrationId.toString());
    if (!registration) {
      throw new NotFoundError("Registration not found");
    }
    const workshop = await this.workshopRepository.findById(payment.workshopId.toString());
    if (!workshop) {
      throw new NotFoundError("Workshop not found");
    }

    return {
      registrationNumber: registration.registrationNumber,
      workshopTitle: workshop.title,
      workshopDate: workshop.date,
      amount: payment.amount,
      gatewayPaymentId: payment.gatewayPaymentId ?? "",
      paidAt: payment.paidAt ?? payment.updatedAt,
      whatsappCommunityLink: workshop.whatsappCommunityLink,
    };
  }

  /** Called from the Checkout page when payment fails or the user dismisses the modal. */
  async recordUnsuccessfulAttempt(
    registrationId: string,
    outcome: "failed" | "cancelled",
    razorpayOrderId?: string
  ): Promise<void> {
    if (razorpayOrderId) {
      const payment = await this.paymentRepository.findByGatewayOrderId(razorpayOrderId);
      if (payment && payment.status === "pending") {
        await this.paymentRepository.updateById(payment._id.toString(), { status: outcome });
      }
    }

    const registration = await this.registrationRepository.findById(registrationId);
    if (registration && registration.paymentStatus !== "paid") {
      await this.registrationRepository.updateById(registrationId, { paymentStatus: outcome });
    }
  }

  /** For the success page to re-fetch display data on a refresh, without creating a new order. */
  async getPaymentContext(registrationId: string): Promise<PaymentResultContext | null> {
    const payments = await this.paymentRepository.findByRegistrationId(registrationId);
    const paidPayment = payments.find((payment) => payment.status === "paid");
    if (!paidPayment) return null;
    return this.buildResultContext(paidPayment);
  }

  /**
   * Razorpay webhooks are the reliable source of truth — the checkout-return
   * call can be missed entirely (closed tab, network drop mid-redirect), so
   * this is what actually guarantees a captured payment gets recorded.
   * Idempotent against the checkout-return path already having handled it.
   */
  async handleWebhookEvent(event: RazorpayWebhookEvent): Promise<void> {
    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity) return;

    const existingPayment = await this.paymentRepository.findByGatewayOrderId(paymentEntity.order_id);
    if (!existingPayment) return; // not an order this system created

    if (event.event === "payment.captured" || event.event === "order.paid") {
      if (existingPayment.status === "paid") return;

      await this.paymentRepository.updateById(existingPayment._id.toString(), {
        gatewayPaymentId: paymentEntity.id,
        status: "paid",
        paidAt: new Date(),
      });
      await this.registrationRepository.updateById(existingPayment.registrationId.toString(), {
        paymentStatus: "paid",
        status: "confirmed",
      });
      return;
    }

    if (event.event === "payment.failed") {
      if (existingPayment.status === "paid") return;

      await this.paymentRepository.updateById(existingPayment._id.toString(), { status: "failed" });
      const registration = await this.registrationRepository.findById(existingPayment.registrationId.toString());
      if (registration && registration.paymentStatus !== "paid") {
        await this.registrationRepository.updateById(existingPayment.registrationId.toString(), {
          paymentStatus: "failed",
        });
      }
    }
  }
}
