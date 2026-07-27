import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { PdfDocumentService } from "@/services/PdfDocumentService";
import { createPdfDocumentSchema } from "@/validators/pdfDocument.schema";

const service = new PdfDocumentService();

export const GET = withErrorHandling(async () => {
  const pdfs = await service.list();
  return apiSuccess(pdfs);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(createPdfDocumentSchema, body);
  const pdf = await service.create(input);
  return apiSuccess(pdf, 201);
});
