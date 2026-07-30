import { FeedbackFormRepository } from "@/repositories/FeedbackFormRepository";
import type { FeedbackFormDocument } from "@/models/FeedbackForm";
import { NotFoundError } from "@/errors/NotFoundError";
import type { CreateFeedbackFormInput, UpdateFeedbackFormInput } from "@/validators/feedbackForm.schema";

/**
 * Business-logic layer for feedback form *definitions*. Same shape as
 * `WorkshopService`/`TestimonialService` — no `displayOrder`, since a
 * form's field order lives inside `fields[]`, not across forms (§9).
 */
export class FeedbackFormService {
  constructor(protected readonly repository: FeedbackFormRepository = new FeedbackFormRepository()) {}

  async list(): Promise<FeedbackFormDocument[]> {
    return this.repository.findMany();
  }

  /** Backs the future public "live form definition" read the site renders. */
  async getActive(): Promise<FeedbackFormDocument[]> {
    return this.repository.findMany({ isActive: true });
  }

  async getById(id: string): Promise<FeedbackFormDocument> {
    const form = await this.repository.findById(id);
    if (!form) {
      throw new NotFoundError(`Feedback form "${id}" not found`);
    }
    return form;
  }

  /**
   * Backs the public `/feedback/[formId]` page and its API read. Unlike
   * `getById` (admin-only), this 404s on an unpublished form too — a
   * disabled form's public link must stop working the moment it's
   * disabled, not just stop being listed.
   */
  async getPublicById(id: string): Promise<FeedbackFormDocument> {
    const form = await this.repository.findById(id);
    if (!form || !form.isActive) {
      throw new NotFoundError(`Feedback form "${id}" not found`);
    }
    return form;
  }

  async create(input: CreateFeedbackFormInput): Promise<FeedbackFormDocument> {
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateFeedbackFormInput): Promise<FeedbackFormDocument> {
    const updated = await this.repository.updateById(id, input);
    if (!updated) {
      throw new NotFoundError(`Feedback form "${id}" not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError(`Feedback form "${id}" not found`);
    }
  }

  async enable(id: string): Promise<FeedbackFormDocument> {
    return this.update(id, { isActive: true });
  }

  async disable(id: string): Promise<FeedbackFormDocument> {
    return this.update(id, { isActive: false });
  }
}
