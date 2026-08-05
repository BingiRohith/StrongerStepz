import { RealLifeStoryRepository } from "@/repositories/RealLifeStoryRepository";
import type { RealLifeStoryDocument } from "@/models/RealLifeStory";
import { NotFoundError } from "@/errors/NotFoundError";
import { deleteFile } from "@/lib/uploads/deleteFile";
import type { CreateRealLifeStoryInput, UpdateRealLifeStoryInput } from "@/validators/realLifeStory.schema";

/**
 * Business-logic layer for real life stories. Same shape as
 * `TestimonialService`/`DoctorService` (`isActive`/`displayOrder`, plus
 * `reorder()`), but with two independent Cloudinary images (before/after)
 * to clean up on replace/delete instead of one.
 */
export class RealLifeStoryService {
  constructor(protected readonly repository: RealLifeStoryRepository = new RealLifeStoryRepository()) {}

  async list(): Promise<RealLifeStoryDocument[]> {
    return this.repository.findMany();
  }

  /** Backs the public "Real Life Stories" homepage section. */
  async getActiveOrdered(): Promise<RealLifeStoryDocument[]> {
    return this.repository.findActiveOrdered();
  }

  async getById(id: string): Promise<RealLifeStoryDocument> {
    const story = await this.repository.findById(id);
    if (!story) {
      throw new NotFoundError(`Real life story "${id}" not found`);
    }
    return story;
  }

  async create(input: CreateRealLifeStoryInput): Promise<RealLifeStoryDocument> {
    return this.repository.create(input);
  }

  /** If `input` carries a new before/after `publicId` that replaces an existing one, the outgoing Cloudinary asset is cleaned up first. */
  async update(id: string, input: UpdateRealLifeStoryInput): Promise<RealLifeStoryDocument> {
    const current = await this.getById(id);
    if (input.beforeImagePublicId && current.beforeImagePublicId && input.beforeImagePublicId !== current.beforeImagePublicId) {
      await deleteFile(current.beforeImagePublicId, "image");
    }
    if (input.afterImagePublicId && current.afterImagePublicId && input.afterImagePublicId !== current.afterImagePublicId) {
      await deleteFile(current.afterImagePublicId, "image");
    }
    const updated = await this.repository.updateById(id, input);
    if (!updated) {
      throw new NotFoundError(`Real life story "${id}" not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const current = await this.getById(id);
    if (current.beforeImagePublicId) {
      await deleteFile(current.beforeImagePublicId, "image");
    }
    if (current.afterImagePublicId) {
      await deleteFile(current.afterImagePublicId, "image");
    }
    await this.repository.deleteById(id);
  }

  async enable(id: string): Promise<RealLifeStoryDocument> {
    return this.update(id, { isActive: true });
  }

  async disable(id: string): Promise<RealLifeStoryDocument> {
    return this.update(id, { isActive: false });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.repository.bulkSetOrder(orderedIds);
  }
}
