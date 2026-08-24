import { z } from "zod";

export const socialMediaLinkSchema = z.object({
  id: z.string().min(1),
  platform: z.enum(["instagram", "facebook", "whatsapp"]),
  url: z.string().url().refine((value) => /^https?:\/\//.test(value), "URL must use http or https"),
  enabled: z.boolean(),
  order: z.number().int().nonnegative(),
});
export const socialMediaLinksSchema = z.array(socialMediaLinkSchema).max(20).refine((links) => new Set(links.map((link) => link.platform)).size === links.length, "Each platform can only be added once");
export type SocialMediaLink = z.infer<typeof socialMediaLinkSchema>;
