import { Schema, model, models, type Model, type Types } from "mongoose";

export type PaymentGateway = "razorpay";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export interface PaymentDocument {
  _id: Types.ObjectId;
  registrationId: Types.ObjectId;
  workshopId: Types.ObjectId;
  /** Paise (Razorpay's native subunit), not rupees — divide by 100 for display. */
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    registrationId: { type: Schema.Types.ObjectId, ref: "Registration", required: true },
    workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    gateway: { type: String, enum: ["razorpay"], required: true, default: "razorpay" },
    gatewayOrderId: { type: String, required: true, unique: true },
    gatewayPaymentId: { type: String },
    gatewaySignature: { type: String },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      required: true,
      default: "pending",
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

// One order per payment record (enforced above via unique), plus the natural
// "does this registration already have a payment" lookup used for idempotency.
paymentSchema.index({ registrationId: 1 });

export const Payment: Model<PaymentDocument> =
  (models.Payment as Model<PaymentDocument>) || model<PaymentDocument>("Payment", paymentSchema);
