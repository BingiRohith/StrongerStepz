import { PdfDocument, type PdfDocumentDocument } from "@/models/PdfDocument";
import { BaseRepository } from "@/repositories/BaseRepository";

/** No bespoke queries needed — the base CRUD set (find/list/update/delete) covers this module. */
export class PdfDocumentRepository extends BaseRepository<PdfDocumentDocument> {
  constructor() {
    super(PdfDocument);
  }
}
