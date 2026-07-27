import { DoctorRepository } from "@/repositories/DoctorRepository";
import type { DoctorDocument } from "@/models/Doctor";
import { NotFoundError } from "@/errors/NotFoundError";
import { deleteFile } from "@/lib/uploads/deleteFile";
import type { CreateDoctorInput, UpdateDoctorInput } from "@/validators/doctor.schema";

/**
 * Business-logic layer for doctors. Identical shape to `TestimonialService`
 * (§6 of the plan) — `isActive`/`displayOrder` instead of a `status` enum,
 * plus `reorder()` and Cloudinary cleanup for the photo on replace/delete.
 */
export class DoctorService {
  constructor(protected readonly repository: DoctorRepository = new DoctorRepository()) {}

  async list(): Promise<DoctorDocument[]> {
    return this.repository.findMany();
  }

  /** Backs the future public "active doctors in order" homepage read. */
  async getActiveOrdered(): Promise<DoctorDocument[]> {
    return this.repository.findActiveOrdered();
  }

  async getById(id: string): Promise<DoctorDocument> {
    const doctor = await this.repository.findById(id);
    if (!doctor) {
      throw new NotFoundError(`Doctor "${id}" not found`);
    }
    return doctor;
  }

  async create(input: CreateDoctorInput): Promise<DoctorDocument> {
    return this.repository.create(input);
  }

  /** If `input` carries a new `photoPublicId` that replaces an existing one, the outgoing Cloudinary asset is cleaned up first. */
  async update(id: string, input: UpdateDoctorInput): Promise<DoctorDocument> {
    const current = await this.getById(id);
    if (input.photoPublicId && current.photoPublicId && input.photoPublicId !== current.photoPublicId) {
      await deleteFile(current.photoPublicId, "image");
    }
    const updated = await this.repository.updateById(id, input);
    if (!updated) {
      throw new NotFoundError(`Doctor "${id}" not found`);
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

  async enable(id: string): Promise<DoctorDocument> {
    return this.update(id, { isActive: true });
  }

  async disable(id: string): Promise<DoctorDocument> {
    return this.update(id, { isActive: false });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.repository.bulkSetOrder(orderedIds);
  }
}
