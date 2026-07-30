import { z } from "zod";

const homepageImageSlotSchema = z.object({
  url: z.string().min(1),
  publicId: z.string().min(1),
});

/** Each slot is independently optional — the admin can set/replace/clear one image without resubmitting the others. */
export const updateHomepageImagesSchema = z.object({
  hero: homepageImageSlotSchema.nullable().optional(),
  benefits: homepageImageSlotSchema.nullable().optional(),
  audience: homepageImageSlotSchema.nullable().optional(),
});

export type HomepageImageSlot = z.infer<typeof homepageImageSlotSchema>;
export type UpdateHomepageImagesInput = z.infer<typeof updateHomepageImagesSchema>;

export interface HomepageImages {
  hero: HomepageImageSlot | null;
  benefits: HomepageImageSlot | null;
  audience: HomepageImageSlot | null;
}
