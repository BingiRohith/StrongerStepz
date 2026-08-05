import { Schema, model, models, type Model, type Types } from "mongoose";

export type QuestionnaireQ1Answer =
  | "I want to stay healthy as I age."
  | "I have a specific health problem I'd like to improve."
  | "My doctor advised me to learn more."
  | "A family member or friend suggested this workshop."
  | "I want to prevent future health problems."
  | "I want to become stronger and more active."
  | "I'm just curious and want to learn."
  | "Other";

export type QuestionnaireQ2Answer =
  | "I want to prevent future health problems."
  | "I want to become stronger and more active."
  | "I want to manage an existing health condition."
  | "I'm here for a family member."
  | "I'm a healthcare professional."
  | "Other";

export type QuestionnaireQ3Answer =
  | "I spend most of my day sitting."
  | "I walk around the house and do light chores."
  | "I walk for at least 30 minutes most days."
  | "I regularly exercise or attend fitness classes."
  | "I do strength training, yoga, or sports regularly.";

export const QUESTIONNAIRE_Q1_ANSWERS: QuestionnaireQ1Answer[] = [
  "I want to stay healthy as I age.",
  "I have a specific health problem I'd like to improve.",
  "My doctor advised me to learn more.",
  "A family member or friend suggested this workshop.",
  "I want to prevent future health problems.",
  "I want to become stronger and more active.",
  "I'm just curious and want to learn.",
  "Other",
];

export const QUESTIONNAIRE_Q2_ANSWERS: QuestionnaireQ2Answer[] = [
  "I want to prevent future health problems.",
  "I want to become stronger and more active.",
  "I want to manage an existing health condition.",
  "I'm here for a family member.",
  "I'm a healthcare professional.",
  "Other",
];

export const QUESTIONNAIRE_Q3_ANSWERS: QuestionnaireQ3Answer[] = [
  "I spend most of my day sitting.",
  "I walk around the house and do light chores.",
  "I walk for at least 30 minutes most days.",
  "I regularly exercise or attend fitness classes.",
  "I do strength training, yoga, or sports regularly.",
];

export interface QuestionnaireResponseDocument {
  _id: Types.ObjectId;
  registrationId: Types.ObjectId;
  /** Denormalized from the registration at submission time — lets admin views filter "Overall" vs. a specific workshop without a join. Optional/absent on pre-Phase-7 documents; backfilled by `scripts/migrate-phase7.ts` where the registration still exists. */
  workshopId?: Types.ObjectId;
  question1Answer: QuestionnaireQ1Answer;
  question1OtherText?: string;
  question2Answer: QuestionnaireQ2Answer;
  question2OtherText?: string;
  question3Answer: QuestionnaireQ3Answer;
  /** Snapshot of the prompt text at submission time (see `src/lib/constants/questionnaire.ts`) — a later wording change never alters how an already-submitted response displays. Optional/absent on pre-Phase-7 documents; the admin UI falls back to the current constant for those. */
  question1Text?: string;
  question2Text?: string;
  question3Text?: string;
  createdAt: Date;
  updatedAt: Date;
}

const questionnaireResponseSchema = new Schema<QuestionnaireResponseDocument>(
  {
    registrationId: { type: Schema.Types.ObjectId, ref: "Registration", required: true },
    workshopId: { type: Schema.Types.ObjectId, ref: "Workshop" },
    question1Answer: { type: String, enum: QUESTIONNAIRE_Q1_ANSWERS, required: true },
    question1OtherText: { type: String, trim: true },
    question2Answer: { type: String, enum: QUESTIONNAIRE_Q2_ANSWERS, required: true },
    question2OtherText: { type: String, trim: true },
    question3Answer: { type: String, enum: QUESTIONNAIRE_Q3_ANSWERS, required: true },
    question1Text: { type: String, trim: true },
    question2Text: { type: String, trim: true },
    question3Text: { type: String, trim: true },
  },
  { timestamps: true }
);

// Not unique: one-submission-per-registration is enforced in
// QuestionnaireResponseService via findByRegistrationId(), not the schema,
// so this stays flexible if that business rule ever changes.
questionnaireResponseSchema.index({ registrationId: 1 });
// Backs the admin "Overall / Workshop A / Workshop B" filter (§3 of the plan).
questionnaireResponseSchema.index({ workshopId: 1 });

export const QuestionnaireResponse: Model<QuestionnaireResponseDocument> =
  (models.QuestionnaireResponse as Model<QuestionnaireResponseDocument>) ||
  model<QuestionnaireResponseDocument>("QuestionnaireResponse", questionnaireResponseSchema);
