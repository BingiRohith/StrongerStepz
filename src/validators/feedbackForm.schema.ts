import { z } from "zod";

export const feedbackFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "single_select",
  "multi_select",
  "rating",
  "boolean",
]);

const SELECT_FIELD_TYPES = new Set(["single_select", "multi_select"]);

export const feedbackFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: feedbackFieldTypeSchema,
    options: z.array(z.string().min(1)).min(2).optional(),
    required: z.boolean(),
  })
  .refine((field) => !SELECT_FIELD_TYPES.has(field.type) || (field.options?.length ?? 0) >= 2, {
    message: "options (min 2) are required when type is single_select or multi_select",
    path: ["options"],
  });

export const createFeedbackFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  fields: z.array(feedbackFieldSchema).default([]),
  isActive: z.boolean().optional(),
});

export const updateFeedbackFormSchema = createFeedbackFormSchema.partial();

export type FeedbackFieldInput = z.infer<typeof feedbackFieldSchema>;
export type CreateFeedbackFormInput = z.infer<typeof createFeedbackFormSchema>;
export type UpdateFeedbackFormInput = z.infer<typeof updateFeedbackFormSchema>;
