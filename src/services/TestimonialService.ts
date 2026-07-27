import { TestimonialRepository } from "@/repositories/TestimonialRepository";
import type { TestimonialDocument } from "@/models/Testimonial";
import { NotFoundError } from "@/errors/NotFoundError";
import { deleteFile } from "@/lib/uploads/deleteFile";
import type { CreateTestimonialInput, UpdateTestimonialInput } from "@/validators/testimonial.schema";

/**
 * Business-logic layer for testimonials. Same shape as `WorkshopService`
 * (`isActive` boolean instead of a `status` enum), plus `reorder()` and
 * Cloudinary cleanup for the photo on replace/delete.
 */
export class TestimonialService {
  constructor(protected readonly repository: TestimonialRepository = new TestimonialRepository()) {}

  async list(): Promise<TestimonialDocument[]> {
    return this.repository.findMany();
  }

  /** Backs the future public "active testimonials in order" homepage read. */
  async getActiveOrdered(): Promise<TestimonialDocument[]> {
    return this.repository.findActiveOrdered();
  }

  async getById(id: string): Promise<TestimonialDocument> {
    const testimonial = await this.repository.findById(id);
    if (!testimonial) {
      throw new NotFoundError(`Testimonial "${id}" not found`);
    }
    return testimonial;
  }

  async create(input: CreateTestimonialInput): Promise<TestimonialDocument> {
    return this.repository.create(input);
  }

  /** If `input` carries a new `photoPublicId` that replaces an existing one, the outgoing Cloudinary asset is cleaned up first. */
  async update(id: string, input: UpdateTestimonialInput): Promise<TestimonialDocument> {
    const current = await this.getById(id);
    if (input.photoPublicId && current.photoPublicId && input.photoPublicId !== current.photoPublicId) {
      await deleteFile(current.photoPublicId, "image");
    }
    const updated = await this.repository.updateById(id, input);
    if (!updated) {
      throw new NotFoundError(`Testimonial "${id}" not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const current = await this.getById(id);
    if (current.photoPublicId) {
      await deleteFile(current.photoPublicId, "image");
    }
    await this.repository.deleteById(id);
  }

  async enable(id: string): Promise<TestimonialDocument> {
    return this.update(id, { isActive: true });
  }

  async disable(id: string): Promise<TestimonialDocument> {
    return this.update(id, { isActive: false });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.repository.bulkSetOrder(orderedIds);
  }
}
