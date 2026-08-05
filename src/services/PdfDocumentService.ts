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

  /** Rolls back the just-uploaded Cloudinary asset if the DB write fails — same "never orphan a new upload" guarantee as `update()`. */
  async create(input: CreatePdfDocumentInput): Promise<PdfDocumentDocument> {
    try {
      return await this.repository.create(input);
    } catch (error) {
      await this.rollbackUpload(input.filePublicId);
      throw error;
    }
  }

  /**
   * If `input` includes a new `fileUrl`/`filePublicId` (a replacement
   * upload), the DB write happens *first*; the outgoing (old) Cloudinary
   * asset is only deleted after that succeeds. If the DB write throws or
   * finds no document, the *newly* uploaded asset is rolled back instead —
   * so a failed replace never orphans the new upload and never loses the
   * still-working old file. If only `title`/`isActive` changed, no
   * Cloudinary call happens at all.
   */
  async update(id: string, input: UpdatePdfDocumentInput): Promise<PdfDocumentDocument> {
    const current = await this.getById(id);
    const isReplacing = Boolean(input.filePublicId) && Boolean(current.filePublicId) && input.filePublicId !== current.filePublicId;

    let updated: PdfDocumentDocument | null;
    try {
      updated = await this.repository.updateById(id, input);
    } catch (error) {
      if (isReplacing) {
        await this.rollbackUpload(input.filePublicId!);
      }
      throw error;
    }

    if (!updated) {
      if (isReplacing) {
        await this.rollbackUpload(input.filePublicId!);
      }
      throw new NotFoundError(`PDF document "${id}" not found`);
    }

    if (isReplacing) {
      // DB write already succeeded — safe to delete the outgoing asset now.
      // A Cloudinary hiccup here shouldn't fail a metadata save that already landed.
      await deleteFile(current.filePublicId, "raw").catch((error: unknown) => {
        console.error(`Failed to delete outgoing PDF asset "${current.filePublicId}" after replace:`, error);
      });
    }

    return updated;
  }

  /** Best-effort cleanup of a newly uploaded Cloudinary asset when the DB write it was meant for never landed — prevents orphaned files. */
  private async rollbackUpload(filePublicId: string): Promise<void> {
    await deleteFile(filePublicId, "raw").catch((error: unknown) => {
      console.error(`Failed to roll back orphaned PDF upload "${filePublicId}":`, error);
    });
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
