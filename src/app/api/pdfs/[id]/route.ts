import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { PdfDocumentService } from "@/services/PdfDocumentService";
import { updatePdfDocumentSchema } from "@/validators/pdfDocument.schema";

interface Params {
  id: string;
}

const service = new PdfDocumentService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const pdf = await service.getById(id);
  return apiSuccess(pdf);
});

/**
 * Body may include title, isActive, and/or a new fileUrl+filePublicId — the
 * outgoing Cloudinary asset (if any) is cleaned up inside the service. No
 * separate "replace" route exists (§7 of the plan).
 */
export const PATCH = withParamsErrorHandling<Params>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const input = parseOrThrow(updatePdfDocumentSchema, body);
  const pdf = await service.update(id, input);
  return apiSuccess(pdf);
});

export const DELETE = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  await service.delete(id);
  return apiSuccess({ deleted: true });
});
