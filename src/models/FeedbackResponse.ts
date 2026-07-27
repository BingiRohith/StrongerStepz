import { Schema, model, models, type Model, type Types } from "mongoose";

export interface FeedbackAnswer {
  fieldKey: string;
  value: unknown;
}

export interface FeedbackResponseDocument {
  _id: Types.ObjectId;
  formId: Types.ObjectId;
  registrationId?: Types.ObjectId;
  answers: FeedbackAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

const feedbackAnswerSchema = new Schema<FeedbackAnswer>(
  {
    fieldKey: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const feedbackResponseSchema = new Schema<FeedbackResponseDocument>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "FeedbackForm", required: true },
    registrationId: { type: Schema.Types.ObjectId, ref: "Registration" },
    answers: { type: [feedbackAnswerSchema], default: [] },
  },
  { timestamps: true }
);

// Serves the future "responses for this form, newest first" admin read.
feedbackResponseSchema.index({ formId: 1, createdAt: -1 });
feedbackResponseSchema.index({ registrationId: 1 }, { sparse: true });

export const FeedbackResponse: Model<FeedbackResponseDocument> =
  (models.FeedbackResponse as Model<FeedbackResponseDocument>) ||
  model<FeedbackResponseDocument>("FeedbackResponse", feedbackResponseSchema);
