import { Types } from "mongoose";
import { Payment, type PaymentDocument } from "@/models/Payment";
import { BaseRepository } from "@/repositories/BaseRepository";

export class PaymentRepository extends BaseRepository<PaymentDocument> {
  constructor() {
    super(Payment);
  }

  async findByRegistrationId(registrationId: string): Promise<PaymentDocument[]> {
    return this.findMany({ registrationId: new Types.ObjectId(registrationId) });
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<PaymentDocument | null> {
    return this.findOne({ gatewayOrderId });
  }

  async findByGatewayPaymentId(gatewayPaymentId: string): Promise<PaymentDocument | null> {
    return this.findOne({ gatewayPaymentId });
  }

  /** Reused across page reloads so a fresh Razorpay order isn't created every time. */
  async findLatestPendingByRegistrationId(registrationId: string): Promise<PaymentDocument | null> {
    return this.findOne({ registrationId: new Types.ObjectId(registrationId), status: "pending" });
  }
}
