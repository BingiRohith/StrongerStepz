import { Types } from "mongoose";
import { Doctor, type DoctorDocument } from "@/models/Doctor";
import { BaseRepository } from "@/repositories/BaseRepository";
import { connectToDatabase } from "@/lib/db/connect";
import { DatabaseError } from "@/errors/DatabaseError";

export class DoctorRepository extends BaseRepository<DoctorDocument> {
  constructor() {
    super(Doctor);
  }

  /** The public "active doctors in display order" read — needs `.sort()`, which the generic `findMany` doesn't expose. */
  async findActiveOrdered(): Promise<DoctorDocument[]> {
    await connectToDatabase();
    try {
      return await this.model.find({ isActive: true }).sort({ displayOrder: 1 }).lean<DoctorDocument[]>().exec();
    } catch (error) {
      throw new DatabaseError("Failed to find active doctors", error);
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
      throw new DatabaseError("Failed to reorder doctors", error);
    }
  }
}
