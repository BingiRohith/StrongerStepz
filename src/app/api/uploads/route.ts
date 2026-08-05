import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { ValidationError } from "@/errors/ValidationError";
import { uploadFile } from "@/lib/uploads/uploadFile";
import type { UploadResourceType } from "@/types/upload";

/**
 * Fixed allow-list of upload destinations — the client never picks the
 * Cloudinary folder or resource type directly. `pdfs` is deliberately not
 * here: PDFs upload directly browser-to-Cloudinary via `/api/uploads/sign`
 * instead, so a large file never has to pass through this Vercel function
 * (see `UploadField.tsx` and `src/app/api/uploads/sign/route.ts`).
 */
const UPLOAD_FOLDERS = {
  testimonials: { cloudinaryFolder: "strongersteps/testimonials", resourceType: "image" as UploadResourceType },
  doctors: { cloudinaryFolder: "strongersteps/doctors", resourceType: "image" as UploadResourceType },
  "real-life-stories": { cloudinaryFolder: "strongersteps/real-life-stories", resourceType: "image" as UploadResourceType },
  homepage: { cloudinaryFolder: "strongersteps/homepage", resourceType: "image" as UploadResourceType },
} as const satisfies Record<string, { cloudinaryFolder: string; resourceType: UploadResourceType }>;

type UploadFolder = keyof typeof UPLOAD_FOLDERS;

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

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

  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    throw new ValidationError("Validation failed", {
      fieldErrors: { file: [`file type must be one of: ${IMAGE_MIME_TYPES.join(", ")}`] },
    });
  }
  if (file.size > IMAGE_MAX_BYTES) {
    throw new ValidationError("Validation failed", {
      fieldErrors: { file: [`file must be smaller than ${IMAGE_MAX_BYTES / (1024 * 1024)}MB`] },
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadFile(buffer, { folder: cloudinaryFolder, resourceType, filename: file.name });

  return apiSuccess(result, 201);
});
