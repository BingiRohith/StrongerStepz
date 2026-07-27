import { Schema, model, models, type Model, type Types } from "mongoose";

export interface PdfDocumentDocument {
  _id: Types.ObjectId;
  title: string;
  fileUrl: string;
  filePublicId: string;
  fileSizeBytes?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pdfDocumentSchema = new Schema<PdfDocumentDocument>(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    filePublicId: { type: String, required: true },
    fileSizeBytes: { type: Number },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const PdfDocument: Model<PdfDocumentDocument> =
  (models.PdfDocument as Model<PdfDocumentDocument>) ||
  model<PdfDocumentDocument>("PdfDocument", pdfDocumentSchema);
