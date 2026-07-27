import { FeedbackResponse, type FeedbackResponseDocument } from "@/models/FeedbackResponse";
import { BaseRepository } from "@/repositories/BaseRepository";
import { connectToDatabase } from "@/lib/db/connect";
import { DatabaseError } from "@/errors/DatabaseError";
import type { PaginatedResult } from "@/types/pagination";

export class FeedbackResponseRepository extends BaseRepository<FeedbackResponseDocument> {
  constructor() {
    super(FeedbackResponse);
  }

  /** Real skip/limit pagination — this collection is unbounded and append-only, unlike Workshop's client-paginated list. */
  async findPaginated(
    filter: Partial<Pick<FeedbackResponseDocument, "formId">>,
    page: number,
    limit: number
  ): Promise<PaginatedResult<FeedbackResponseDocument>> {
    await connectToDatabase();
    try {
      const [items, total] = await Promise.all([
        this.model
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean<FeedbackResponseDocument[]>()
          .exec(),
        this.model.countDocuments(filter).exec(),
      ]);
      return { items, total, page, limit };
    } catch (error) {
      throw new DatabaseError("Failed to find feedback responses", error);
    }
  }
}
