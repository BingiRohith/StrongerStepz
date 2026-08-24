import { SettingsRepository } from "@/repositories/SettingsRepository";
import type { SocialMediaLink } from "@/validators/socialMedia.schema";
const KEY = "socialMediaLinks";
export class SocialMediaService {
  constructor(private readonly repository = new SettingsRepository()) {}
  async get(): Promise<SocialMediaLink[]> {
    const setting = await this.repository.findByKey(KEY);
    const value = Array.isArray(setting?.value) ? setting.value : [];
    return value
      .filter((link): link is SocialMediaLink => typeof link === "object" && link !== null && typeof (link as SocialMediaLink).id === "string" && ["instagram", "facebook", "whatsapp"].includes((link as SocialMediaLink).platform) && typeof (link as SocialMediaLink).url === "string" && typeof (link as SocialMediaLink).enabled === "boolean" && typeof (link as SocialMediaLink).order === "number")
      .sort((a, b) => a.order - b.order);
  }
  async set(links: SocialMediaLink[]): Promise<SocialMediaLink[]> { await this.repository.upsertByKey(KEY, links); return links.sort((a, b) => a.order - b.order); }
}
