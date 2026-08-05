import { Schema, model, models, type Model, type Types } from "mongoose";

export type RegistrationStatus = "pending_payment" | "confirmed" | "cancelled";

/**
 * Which `RegistrationStatus` values count as a "successful registration" for
 * public-facing stats (homepage counter) and similar aggregates. A single
 * array here — extend it if a future status (e.g. "attended") should also
 * count — instead of that logic being inlined wherever the count is read.
 */
export const SUCCESSFUL_REGISTRATION_STATUSES: RegistrationStatus[] = ["confirmed"];
export type RegistrationPaymentStatus = "n/a" | "pending" | "paid" | "failed" | "cancelled" | "refunded";
export type RegistrationGender = "male" | "female" | "other" | "prefer_not_to_say";
export type RegistrationPreferredLanguage = "Telugu" | "Hindi" | "English" | "Others";

export interface RegistrationDocument {
  _id: Types.ObjectId;
  workshopId: Types.ObjectId;
  registrationNumber: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: RegistrationGender;
  city: string;
  preferredLanguage: RegistrationPreferredLanguage;
  status: RegistrationStatus;
  joinedCommunity: boolean;
  paymentStatus: RegistrationPaymentStatus;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<RegistrationDocument>(
  {
    workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
    registrationNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"], required: true },
    city: { type: String, required: true, trim: true },
    preferredLanguage: { type: String, enum: ["Telugu", "Hindi", "English", "Others"], required: true },
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "cancelled"],
      required: true,
      default: "pending_payment",
    },
    joinedCommunity: { type: Boolean, required: true, default: false },
    paymentStatus: {
      type: String,
      enum: ["n/a", "pending", "paid", "failed", "cancelled", "refunded"],
      required: true,
      default: "n/a",
    },
    source: { type: String, required: true, default: "landing-page" },
  },
  { timestamps: true }
);

// The core business rule: one registration per mobile number per workshop.
// Also the natural "registrations for this workshop" lookup.
registrationSchema.index({ workshopId: 1, phone: 1 }, { unique: true });

export const Registration: Model<RegistrationDocument> =
  (models.Registration as Model<RegistrationDocument>) ||
  model<RegistrationDocument>("Registration", registrationSchema);
