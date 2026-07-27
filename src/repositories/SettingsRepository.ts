import { Settings, type SettingsDocument } from "@/models/Settings";
import { BaseRepository } from "@/repositories/BaseRepository";
import { connectToDatabase } from "@/lib/db/connect";
import { DatabaseError } from "@/errors/DatabaseError";

export class SettingsRepository extends BaseRepository<SettingsDocument> {
  constructor() {
    super(Settings);
  }

  async findByKey(key: string): Promise<SettingsDocument | null> {
    return this.findOne({ key });
  }

  async upsertByKey(key: string, value: unknown): Promise<SettingsDocument> {
    await connectToDatabase();
    let doc: SettingsDocument | null;
    try {
      doc = await Settings.findOneAndUpdate({ key }, { key, value }, { returnDocument: "after", upsert: true })
        .lean<SettingsDocument>()
        .exec();
    } catch (error) {
      throw new DatabaseError("Failed to upsert setting", error);
    }
    if (!doc) {
      throw new DatabaseError("Upsert returned no document");
    }
    return doc;
  }
}
