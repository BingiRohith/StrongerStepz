import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { ValidationError } from "@/errors/ValidationError";
import { uploadFile } from "@/lib/uploads/uploadFile";
import type { UploadResourceType } from "@/types/upload";

/** Fixed allow-list of upload destinations — the client never picks the Cloudinary folder or resource type directly. */
const UPLOAD_FOLDERS = {
  testimonials: { cloudinaryFolder: "strongersteps/testimonials", resourceType: "image" as UploadResourceType },
  doctors: { cloudinaryFolder: "strongersteps/doctors", resourceType: "image" as UploadResourceType },
  pdfs: { cloudinaryFolder: "strongersteps/pdfs", resourceType: "raw" as UploadResourceType },
} as const satisfies Record<string, { cloudinaryFolder: string; resourceType: UploadResourceType }>;

type UploadFolder = keyof typeof UPLOAD_FOLDERS;

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PDF_MIME_TYPES = ["application/pdf"];
const PDF_MAX_BYTES = 15 * 1024 * 1024;

function isUploadFolder(value: string): value is UploadFolder {
  return value in UPLOAD_FOLDERS;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder");

  if (!(file instanceof File)) {
    throw new ValidationError("Validation failed", { fieldErrors: { file: ["A file is required"] } });
  }
  if (typeof folder !== "string" || !isUploadFolder(folder)) {
    throw new ValidationError("Validation failed", {
      fieldErrors: { folder: [`folder must be one of: ${Object.keys(UPLOAD_FOLDERS).join(", ")}`] },
    });
  }

  const { cloudinaryFolder, resourceType } = UPLOAD_FOLDERS[folder];
  const allowedMimeTypes = resourceType === "image" ? IMAGE_MIME_TYPES : PDF_MIME_TYPES;
  const maxBytes = resourceType === "image" ? IMAGE_MAX_BYTES : PDF_MAX_BYTES;

  if (!allowedMimeTypes.includes(file.type)) {
    throw new ValidationError("Validation failed", {
      fieldErrors: { file: [`file type must be one of: ${allowedMimeTypes.join(", ")}`] },
    });
  }
  if (file.size > maxBytes) {
    throw new ValidationError("Validation failed", {
      fieldErrors: { file: [`file must be smaller than ${maxBytes / (1024 * 1024)}MB`] },
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadFile(buffer, { folder: cloudinaryFolder, resourceType, filename: file.name });

  return apiSuccess(result, 201);
});
