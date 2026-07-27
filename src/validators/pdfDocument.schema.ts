import { z } from "zod";

export const createPdfDocumentSchema = z.object({
  title: z.string().min(1),
  fileUrl: z.string().min(1),
  filePublicId: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const updatePdfDocumentSchema = createPdfDocumentSchema.partial();

export type CreatePdfDocumentInput = z.infer<typeof createPdfDocumentSchema>;
export type UpdatePdfDocumentInput = z.infer<typeof updatePdfDocumentSchema>;
