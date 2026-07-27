import { PdfDocumentRepository } from "@/repositories/PdfDocumentRepository";
import type { PdfDocumentDocument } from "@/models/PdfDocument";
import { NotFoundError } from "@/errors/NotFoundError";
import { deleteFile } from "@/lib/uploads/deleteFile";
import type { CreatePdfDocumentInput, UpdatePdfDocumentInput } from "@/validators/pdfDocument.schema";

/**
 * Business-logic layer for PDF management. No dedicated "replace" action —
 * per §7 of the plan, uploading a new file during an edit is handled
 * transparently inside the normal `update()`.
 */
export class PdfDocumentService {
  constructor(protected readonly repository: PdfDocumentRepository = new PdfDocumentRepository()) {}

  async list(): Promise<PdfDocumentDocument[]> {
    return this.repository.findMany();
  }

  /** Backs the future public "active PDFs" homepage download-link read. */
  async getActive(): Promise<PdfDocumentDocument[]> {
    return this.repository.findMany({ isActive: true });
  }

  async getById(id: string): Promise<PdfDocumentDocument> {
    const doc = await this.repository.findById(id);
    if (!doc) {
      throw new NotFoundError(`PDF document "${id}" not found`);
    }
    return doc;
  }

  async create(input: CreatePdfDocumentInput): Promise<PdfDocumentDocument> {
    return this.repository.create(input);
  }

  /**
   * If `input` includes a new `fileUrl`/`filePublicId` (a replacement upload),
   * the outgoing Cloudinary asset is deleted before the update lands. If only
   * `title`/`isActive` changed, no Cloudinary call happens.
   */
  async update(id: string, input: UpdatePdfDocumentInput): Promise<PdfDocumentDocument> {
    const current = await this.getById(id);
    if (input.filePublicId && current.filePublicId && input.filePublicId !== current.filePublicId) {
      await deleteFile(current.filePublicId, "raw");
    }
    const updated = await this.repository.updateById(id, input);
    if (!updated) {
      throw new NotFoundError(`PDF document "${id}" not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const current = await this.getById(id);
    if (current.filePublicId) {
      await deleteFile(current.filePublicId, "raw");
    }
    await this.repository.deleteById(id);
  }

  async enable(id: string): Promise<PdfDocumentDocument> {
    return this.update(id, { isActive: true });
  }

  async disable(id: string): Promise<PdfDocumentDocument> {
    return this.update(id, { isActive: false });
  }
}
