import { Schema, model, models, type Model } from "mongoose";

/**
 * Internal-only collection backing atomic sequence generation (currently
 * just registration numbers — `RegistrationNumberGenerator` is the only
 * consumer). `_id` is the counter's key (e.g. "registration-2026"), not a
 * Mongo-generated ObjectId.
 */
export interface CounterDocument {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDocument>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter: Model<CounterDocument> =
  (models.Counter as Model<CounterDocument>) || model<CounterDocument>("Counter", counterSchema);
