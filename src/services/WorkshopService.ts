import { WorkshopRepository } from "@/repositories/WorkshopRepository";
import type { WorkshopDocument } from "@/models/Workshop";
import { NotFoundError } from "@/errors/NotFoundError";
import type { CreateWorkshopInput, ListWorkshopsQuery, UpdateWorkshopInput } from "@/validators/workshop.schema";

/**
 * Business-logic layer for workshops. Route handlers validate input with
 * Zod and pass already-typed data here; this is where the actual rules
 * live (currently just "does it exist", plus the enable/disable and
 * get-active semantics — capacity enforcement arrives with registrations).
 */
export class WorkshopService {
  constructor(protected readonly repository: WorkshopRepository = new WorkshopRepository()) {}

  async list(query: ListWorkshopsQuery = {}): Promise<WorkshopDocument[]> {
    const filter: Partial<Pick<WorkshopDocument, "status" | "featured">> = {};
    if (query.status) filter.status = query.status;
    if (query.featured !== undefined) filter.featured = query.featured;
    return this.repository.findMany(filter);
  }

  async getById(id: string): Promise<WorkshopDocument> {
    const workshop = await this.repository.findById(id);
    if (!workshop) {
      throw new NotFoundError(`Workshop "${id}" not found`);
    }
    return workshop;
  }

  async getBySlug(slug: string): Promise<WorkshopDocument> {
    const workshop = await this.repository.findBySlug(slug);
    if (!workshop) {
      throw new NotFoundError(`Workshop with slug "${slug}" not found`);
    }
    return workshop;
  }

  /** The one workshop the public landing page shows — published AND marked featured. */
  async getActive(): Promise<WorkshopDocument> {
    const workshop = await this.repository.findActive();
    if (!workshop) {
      throw new NotFoundError("No active workshop is currently published");
    }
    return workshop;
  }

  async create(input: CreateWorkshopInput): Promise<WorkshopDocument> {
    return this.repository.create(input as unknown as Partial<WorkshopDocument>);
  }

  async update(id: string, input: UpdateWorkshopInput): Promise<WorkshopDocument> {
    const workshop = await this.repository.updateById(id, input as unknown as Partial<WorkshopDocument>);
    if (!workshop) {
      throw new NotFoundError(`Workshop "${id}" not found`);
    }
    return workshop;
  }

  async delete(id: string): Promise<void> {
    const workshop = await this.repository.deleteById(id);
    if (!workshop) {
      throw new NotFoundError(`Workshop "${id}" not found`);
    }
  }

  async enable(id: string): Promise<WorkshopDocument> {
    return this.update(id, { status: "published" });
  }

  async disable(id: string): Promise<WorkshopDocument> {
    return this.update(id, { status: "disabled" });
  }
}
