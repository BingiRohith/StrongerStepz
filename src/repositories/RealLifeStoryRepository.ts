import { Types } from "mongoose";
import { RealLifeStory, type RealLifeStoryDocument } from "@/models/RealLifeStory";
import { BaseRepository } from "@/repositories/BaseRepository";
import { connectToDatabase } from "@/lib/db/connect";
import { DatabaseError } from "@/errors/DatabaseError";

export class RealLifeStoryRepository extends BaseRepository<RealLifeStoryDocument> {
  constructor() {
    super(RealLifeStory);
  }

  /** The public "active real life stories in display order" read — needs `.sort()`, which the generic `findMany` doesn't expose. */
  async findActiveOrdered(): Promise<RealLifeStoryDocument[]> {
    await connectToDatabase();
    try {
      return await this.model.find({ isActive: true }).sort({ displayOrder: 1 }).lean<RealLifeStoryDocument[]>().exec();
    } catch (error) {
      throw new DatabaseError("Failed to find active real life stories", error);
    }
  }

  /** Sets `displayOrder` to each id's index in `orderedIds`, in one round trip. */
  async bulkSetOrder(orderedIds: string[]): Promise<void> {
    await connectToDatabase();
    try {
      await this.model.bulkWrite(
        orderedIds.map((id, index) => ({
          updateOne: {
            filter: { _id: new Types.ObjectId(id) },
            update: { $set: { displayOrder: index } },
          },
        }))
      );
    } catch (error) {
      throw new DatabaseError("Failed to reorder real life stories", error);
    }
  }
}
