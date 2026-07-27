import { Types } from "mongoose";
import { Testimonial, type TestimonialDocument } from "@/models/Testimonial";
import { BaseRepository } from "@/repositories/BaseRepository";
import { connectToDatabase } from "@/lib/db/connect";
import { DatabaseError } from "@/errors/DatabaseError";

export class TestimonialRepository extends BaseRepository<TestimonialDocument> {
  constructor() {
    super(Testimonial);
  }

  /** The public "active testimonials in display order" read — needs `.sort()`, which the generic `findMany` doesn't expose. */
  async findActiveOrdered(): Promise<TestimonialDocument[]> {
    await connectToDatabase();
    try {
      return await this.model.find({ isActive: true }).sort({ displayOrder: 1 }).lean<TestimonialDocument[]>().exec();
    } catch (error) {
      throw new DatabaseError("Failed to find active testimonials", error);
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
      throw new DatabaseError("Failed to reorder testimonials", error);
    }
  }
}
