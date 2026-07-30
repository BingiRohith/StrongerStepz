import { SettingsRepository } from "@/repositories/SettingsRepository";
import type { AudienceContent, UpdateAudienceContentInput } from "@/validators/audienceContent.schema";

const SETTINGS_KEY = "audienceContent";

const DEFAULT_CONTENT: AudienceContent = {
  title: "Is This For Me?",
  positives: [
    "Adults above 50 looking to move with confidence",
    "Low confidence in everyday movement",
    "Afraid of weakness or falls",
    "Families wanting elders to stay active",
    "Beginners who want a gentle, guided start",
  ],
  negatives: [
    "Looking for high-intensity, fast-paced workouts",
    "Want to train alone without guidance",
    "Expecting an overnight transformation",
    "Comfortable in large, impersonal gym settings",
    "Not ready to commit to gentle, consistent practice",
  ],
};

/**
 * Owns the "Is This For Me?" title + 5 positive/5 negative statements as a
 * single row in the generic `Settings` key/value store — site-wide copy that
 * isn't tied to a specific workshop, so it doesn't belong on `Workshop`, and
 * there's always exactly one title + 5 + 5, so a dedicated CRUD collection
 * would be overkill (same reasoning as `HomepageImagesService`).
 */
export class AudienceContentService {
  constructor(protected readonly repository: SettingsRepository = new SettingsRepository()) {}

  async get(): Promise<AudienceContent> {
    const setting = await this.repository.findByKey(SETTINGS_KEY);
    if (!setting) return DEFAULT_CONTENT;
    return { ...DEFAULT_CONTENT, ...(setting.value as Partial<AudienceContent>) };
  }

  async update(input: UpdateAudienceContentInput): Promise<AudienceContent> {
    const setting = await this.repository.upsertByKey(SETTINGS_KEY, input);
    return setting.value as AudienceContent;
  }
}
