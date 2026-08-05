import { z } from "zod";

export const createRealLifeStorySchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
  location: z.string().min(1).optional(),
  title: z.string().min(1),
  storyDescription: z.string().min(1),
  beforeImageUrl: z.string().min(1).optional(),
  beforeImagePublicId: z.string().min(1).optional(),
  afterImageUrl: z.string().min(1).optional(),
  afterImagePublicId: z.string().min(1).optional(),
  highlightQuote: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const updateRealLifeStorySchema = createRealLifeStorySchema.partial();

export const reorderRealLifeStoriesSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export type CreateRealLifeStoryInput = z.infer<typeof createRealLifeStorySchema>;
export type UpdateRealLifeStoryInput = z.infer<typeof updateRealLifeStorySchema>;
export type ReorderRealLifeStoriesInput = z.infer<typeof reorderRealLifeStoriesSchema>;
