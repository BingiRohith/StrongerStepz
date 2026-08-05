import { z } from "zod";

/** Empty string is allowed (not-yet-configured state); a non-empty value must be a real URL. */
const inviteUrlSchema = z.union([z.literal(""), z.string().trim().url()]);

export const updateWhatsappCommunitySchema = z.object({
  inviteUrl: inviteUrlSchema,
  buttonText: z.string().trim().min(1).max(80),
  enabled: z.boolean(),
});

export type UpdateWhatsappCommunityInput = z.infer<typeof updateWhatsappCommunitySchema>;

export interface WhatsappCommunitySettings {
  inviteUrl: string;
  buttonText: string;
  enabled: boolean;
}
