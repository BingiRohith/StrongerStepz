import { Schema, model, models, type Model, type Types } from "mongoose";

export interface FeedbackAnswer {
  fieldKey: string;
  /** Snapshot of the field's label at submission time — a later edit/removal of the form field never alters how an already-submitted answer displays. Optional/absent on pre-Phase-7 documents; the admin UI falls back to looking the field up on the current form for those. */
  label?: string;
  value: unknown;
}

export interface FeedbackResponseDocument {
  _id: Types.ObjectId;
  formId: Types.ObjectId;
  registrationId?: Types.ObjectId;
  /** Denormalized from the registration (when present) at submission time — lets admin views filter "Overall" vs. a specific workshop without a join. Absent for anonymous/unregistered submissions, and on pre-Phase-7 documents. */
  workshopId?: Types.ObjectId;
  answers: FeedbackAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

const feedbackAnswerSchema = new Schema<FeedbackAnswer>(
  {
    fieldKey: { type: String, required: true },
    label: { type: String, trim: true },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const feedbackResponseSchema = new Schema<FeedbackResponseDocument>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "FeedbackForm", required: true },
    registrationId: { type: Schema.Types.ObjectId, ref: "Registration" },
    workshopId: { type: Schema.Types.ObjectId, ref: "Workshop" },
    answers: { type: [feedbackAnswerSchema], default: [] },
  },
  { timestamps: true }
);

// Serves the future "responses for this form, newest first" admin read.
feedbackResponseSchema.index({ formId: 1, createdAt: -1 });
feedbackResponseSchema.index({ registrationId: 1 }, { sparse: true });
// Backs the admin "Overall / Workshop A / Workshop B" filter (§3 of the plan).
feedbackResponseSchema.index({ workshopId: 1 }, { sparse: true });

export const FeedbackResponse: Model<FeedbackResponseDocument> =
  (models.FeedbackResponse as Model<FeedbackResponseDocument>) ||
  model<FeedbackResponseDocument>("FeedbackResponse", feedbackResponseSchema);
