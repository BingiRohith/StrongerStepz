import { FeedbackForm, type FeedbackFormDocument } from "@/models/FeedbackForm";
import { BaseRepository } from "@/repositories/BaseRepository";

/** No bespoke queries needed — the base CRUD set (find/list/update/delete) covers this module. */
export class FeedbackFormRepository extends BaseRepository<FeedbackFormDocument> {
  constructor() {
    super(FeedbackForm);
  }
}
