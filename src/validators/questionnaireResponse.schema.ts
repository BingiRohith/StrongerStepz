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

export const createQuestionnaireResponseSchema = z
  .object({
    registrationId: objectIdSchema,
    question1Answer: questionnaireQ1AnswerSchema,
    question1OtherText: z.string().min(1).optional(),
    question2Answer: questionnaireQ2AnswerSchema,
    question2OtherText: z.string().min(1).optional(),
    question3Answer: questionnaireQ3AnswerSchema,
  })
  .refine((data) => data.question1Answer !== "Other" || Boolean(data.question1OtherText), {
    message: "question1OtherText is required when question1Answer is \"Other\"",
    path: ["question1OtherText"],
  })
  .refine((data) => data.question2Answer !== "Other" || Boolean(data.question2OtherText), {
    message: "question2OtherText is required when question2Answer is \"Other\"",
    path: ["question2OtherText"],
  });

export const listQuestionnaireResponsesQuerySchema = z.object({
  registrationId: objectIdSchema.optional(),
  workshopId: objectIdSchema.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type CreateQuestionnaireResponseInput = z.infer<typeof createQuestionnaireResponseSchema>;
export type ListQuestionnaireResponsesQuery = z.infer<typeof listQuestionnaireResponsesQuerySchema>;
