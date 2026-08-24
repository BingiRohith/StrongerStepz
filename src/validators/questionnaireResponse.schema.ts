import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "must be a valid registration id");

export const questionnaireQ1AnswerSchema = z.enum([
  "I want to stay healthy as I age.",
  "I have a specific health problem I'd like to improve.",
  "My doctor advised me to learn more.",
  "A family member or friend suggested this workshop.",
  "I want to prevent future health problems.",
  "I want to become stronger and more active.",
  "I'm just curious and want to learn.",
  "Other",
]);

export const questionnaireQ2AnswerSchema = z.enum([
  "I want to prevent future health problems.",
  "I want to become stronger and more active.",
  "I want to manage an existing health condition.",
  "I'm here for a family member.",
  "I'm a healthcare professional.",
  "Other",
]);

export const questionnaireQ3AnswerSchema = z.enum([
  "I spend most of my day sitting.",
  "I walk around the house and do light chores.",
  "I walk for at least 30 minutes most days.",
  "I regularly exercise or attend fitness classes.",
  "I do strength training, yoga, or sports regularly.",
]);

export const createQuestionnaireResponseSchema = z.object({
  registrationId: objectIdSchema,
  // A workshop may intentionally have no questions; its registrant can still
  // complete the post-registration PDF/WhatsApp flow with an empty snapshot.
  questions: z.array(z.object({ questionId: objectIdSchema, answer: z.string().trim().min(1).max(5000) })),
});

export const listQuestionnaireResponsesQuerySchema = z.object({
  registrationId: objectIdSchema.optional(),
  workshopId: objectIdSchema.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type CreateQuestionnaireResponseInput = z.infer<typeof createQuestionnaireResponseSchema>;
export type ListQuestionnaireResponsesQuery = z.infer<typeof listQuestionnaireResponsesQuerySchema>;
