import { SettingsRepository } from "@/repositories/SettingsRepository";
import { deleteFile } from "@/lib/uploads/deleteFile";
import type { HomepageImages, UpdateHomepageImagesInput } from "@/validators/homepageImages.schema";

const SETTINGS_KEY = "homepageImages";
const EMPTY_IMAGES: HomepageImages = { hero: null, benefits: null, audience: null };
const SLOTS = ["hero", "benefits", "audience"] as const;

/**
 * Owns the 3 fixed homepage image slots (hero, benefits, audience) as a single
 * row in the generic `Settings` key/value store — these are site-wide config,
 * not a per-workshop-campaign concept, so they don't belong on `Workshop`, and
 * there are only ever 3 fixed slots, so a dedicated CRUD collection would be
 * overkill.
 */
export class HomepageImagesService {
  constructor(protected readonly repository: SettingsRepository = new SettingsRepository()) {}

  async get(): Promise<HomepageImages> {
    const setting = await this.repository.findByKey(SETTINGS_KEY);
    if (!setting) return EMPTY_IMAGES;
    return { ...EMPTY_IMAGES, ...(setting.value as Partial<HomepageImages>) };
  }

  /** Replaces only the slots present in `input`; cleans up the outgoing Cloudinary asset for any slot that's replaced or cleared. */
  async update(input: UpdateHomepageImagesInput): Promise<HomepageImages> {
    const current = await this.get();
    const next: HomepageImages = { ...current };

    for (const slot of SLOTS) {
      if (!(slot in input)) continue;
      const incoming = input[slot] ?? null;
      const existing = current[slot];
      if (existing && existing.publicId !== incoming?.publicId) {
        await deleteFile(existing.publicId, "image");
      }
      next[slot] = incoming;
    }

    const setting = await this.repository.upsertByKey(SETTINGS_KEY, next);
    return setting.value as HomepageImages;
  }
}
