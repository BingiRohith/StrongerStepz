import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { PdfDocumentService } from "@/services/PdfDocumentService";

const service = new PdfDocumentService();

/** Public read — future homepage download links. */
export const GET = withErrorHandling(async () => {
  const pdfs = await service.getActive();
  return apiSuccess(pdfs);
});
