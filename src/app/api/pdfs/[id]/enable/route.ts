import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { PdfDocumentService } from "@/services/PdfDocumentService";

interface Params {
  id: string;
}

const service = new PdfDocumentService();

export const PATCH = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const pdf = await service.enable(id);
  return apiSuccess(pdf);
});
