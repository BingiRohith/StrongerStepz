import { z } from "zod";

export const createTestimonialSchema = z.object({
  name: z.string().min(1),
  message: z.string().min(1),
  photoUrl: z.string().min(1).optional(),
  photoPublicId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();

export const reorderTestimonialsSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
export type ReorderTestimonialsInput = z.infer<typeof reorderTestimonialsSchema>;
