import { SettingsRepository } from "@/repositories/SettingsRepository";
import type { SettingInput } from "@/validators/settings.schema";

/**
 * Business-logic layer for site-wide settings. Every method is an
 * intentional stub; a later phase fills in the logic on top of
 * `SettingsRepository`.
 */
export class SettingsService {
  constructor(protected readonly repository: SettingsRepository = new SettingsRepository()) {}

  async get(_key: string): Promise<unknown> {
    throw new Error("Not implemented yet");
  }

  async set(_input: SettingInput): Promise<void> {
    throw new Error("Not implemented yet");
  }
}
