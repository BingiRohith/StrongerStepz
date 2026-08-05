import { SettingsRepository } from "@/repositories/SettingsRepository";
import type { UpdateWhatsappCommunityInput, WhatsappCommunitySettings } from "@/validators/whatsappCommunity.schema";

const SETTINGS_KEY = "whatsappCommunityPostDownload";

/**
 * Distinct from `Workshop.whatsappCommunityLink` (shown on the payment
 * success page, per-workshop) — this is the site-wide invite link/button
 * shown after a registrant downloads the workshop PDF, admin-editable from
 * Settings. Same "single row in the generic `Settings` key/value store"
 * pattern as `AudienceContentService`/`HomepageImagesService`.
 */
const DEFAULT_SETTINGS: WhatsappCommunitySettings = {
  inviteUrl: "",
  buttonText: "Join our WhatsApp Community",
  enabled: false,
};

export class WhatsappCommunityService {
  constructor(protected readonly repository: SettingsRepository = new SettingsRepository()) {}

  async get(): Promise<WhatsappCommunitySettings> {
    const setting = await this.repository.findByKey(SETTINGS_KEY);
    if (!setting) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(setting.value as Partial<WhatsappCommunitySettings>) };
  }

  async update(input: UpdateWhatsappCommunityInput): Promise<WhatsappCommunitySettings> {
    const setting = await this.repository.upsertByKey(SETTINGS_KEY, input);
    return setting.value as WhatsappCommunitySettings;
  }
}
