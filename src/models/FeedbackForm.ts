import { Schema, model, models, type Model, type Types } from "mongoose";

export type FeedbackFieldType = "text" | "textarea" | "single_select" | "multi_select" | "rating" | "boolean";

export interface FeedbackFormField {
  key: string;
  label: string;
  type: FeedbackFieldType;
  options?: string[];
  required: boolean;
}

export interface FeedbackFormDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  fields: FeedbackFormField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackFormFieldSchema = new Schema<FeedbackFormField>(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "textarea", "single_select", "multi_select", "rating", "boolean"],
      required: true,
    },
    options: { type: [String], default: undefined },
    required: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const feedbackFormSchema = new Schema<FeedbackFormDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    fields: { type: [feedbackFormFieldSchema], default: [] },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const FeedbackForm: Model<FeedbackFormDocument> =
  (models.FeedbackForm as Model<FeedbackFormDocument>) ||
  model<FeedbackFormDocument>("FeedbackForm", feedbackFormSchema);
