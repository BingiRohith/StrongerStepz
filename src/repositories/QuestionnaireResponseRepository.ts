import { Types } from "mongoose";
import { QuestionnaireResponse, type QuestionnaireResponseDocument } from "@/models/QuestionnaireResponse";
import { BaseRepository } from "@/repositories/BaseRepository";
import { connectToDatabase } from "@/lib/db/connect";
import { DatabaseError } from "@/errors/DatabaseError";
import type { PaginatedResult } from "@/types/pagination";

export class QuestionnaireResponseRepository extends BaseRepository<QuestionnaireResponseDocument> {
  constructor() {
    super(QuestionnaireResponse);
  }

  /** Used both to enforce one-submission-per-registration at submit time and for a future admin lookup. */
  async findByRegistrationId(registrationId: string): Promise<QuestionnaireResponseDocument | null> {
    return this.findOne({ registrationId: new Types.ObjectId(registrationId) });
  }

  /** Real skip/limit pagination — this collection is unbounded and append-only, unlike Workshop's client-paginated list. */
  async findPaginated(
    filter: Partial<Pick<QuestionnaireResponseDocument, "registrationId" | "workshopId">>,
    page: number,
    limit: number
  ): Promise<PaginatedResult<QuestionnaireResponseDocument>> {
    await connectToDatabase();
    try {
      const [items, total] = await Promise.all([
        this.model
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean<QuestionnaireResponseDocument[]>()
          .exec(),
        this.model.countDocuments(filter).exec(),
      ]);
      return { items, total, page, limit };
    } catch (error) {
      throw new DatabaseError("Failed to find questionnaire responses", error);
    }
  }
}
