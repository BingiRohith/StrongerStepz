import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "must be a valid id");

const feedbackAnswerSchema = z.object({
  fieldKey: z.string().min(1),
  value: z.unknown(),
});

/**
 * Validates only the submission *envelope* — which form, which registrant,
 * which field keys got which raw values. The real constraints (which keys
 * are required, which values are valid for a given field) live in the
 * `FeedbackForm` document referenced by `formId`, not in a static schema,
 * so they're checked by hand in the service layer instead of here.
 */
export const submitFeedbackResponseEnvelopeSchema = z.object({
  formId: objectIdSchema,
  registrationId: objectIdSchema.optional(),
  answers: z.array(feedbackAnswerSchema),
});

export const listFeedbackResponsesQuerySchema = z.object({
  formId: objectIdSchema.optional(),
  workshopId: objectIdSchema.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type SubmitFeedbackResponseEnvelopeInput = z.infer<typeof submitFeedbackResponseEnvelopeSchema>;
export type ListFeedbackResponsesQuery = z.infer<typeof listFeedbackResponsesQuerySchema>;
