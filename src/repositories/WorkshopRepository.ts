import { Workshop, type WorkshopDocument } from "@/models/Workshop";
import { BaseRepository } from "@/repositories/BaseRepository";
import { connectToDatabase } from "@/lib/db/connect";
import { DatabaseError } from "@/errors/DatabaseError";

export class WorkshopRepository extends BaseRepository<WorkshopDocument> {
  constructor() {
    super(Workshop);
  }

  async findBySlug(slug: string): Promise<WorkshopDocument | null> {
    return this.findOne({ slug });
  }

  /** The single published + featured workshop the public site should show — needs `.sort()`, which the generic `findOne` doesn't expose. */
  async findActive(): Promise<WorkshopDocument | null> {
    await connectToDatabase();
    try {
      return await this.model
        .findOne({ status: "published", featured: true })
        .sort({ date: -1 })
        .lean<WorkshopDocument>()
        .exec();
    } catch (error) {
      throw new DatabaseError("Failed to find active workshop", error);
    }
  }
}
