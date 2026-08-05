import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { ValidationError } from "@/errors/ValidationError";
import { getCloudinaryCredentials } from "@/lib/uploads/cloudinary";
import { signUploadParams } from "@/lib/uploads/signUpload";

/**
 * Fixed allow-list of folders this endpoint will sign for — mirrors
 * `/api/uploads`'s `UPLOAD_FOLDERS`, but only for the resource types that
 * actually need a direct-to-Cloudinary upload today (large PDFs bypassing
 * Vercel's ~4.5MB function body cap — see `UploadField.tsx`).
 */
const SIGNED_UPLOAD_FOLDERS = {
  pdfs: { cloudinaryFolder: "strongersteps/pdfs", resourceType: "raw" as const, allowedFormats: "pdf", maxBytes: 15 * 1024 * 1024 },
} as const satisfies Record<string, { cloudinaryFolder: string; resourceType: "raw"; allowedFormats: string; maxBytes: number }>;

type SignedUploadFolder = keyof typeof SIGNED_UPLOAD_FOLDERS;

function isSignedUploadFolder(value: unknown): value is SignedUploadFolder {
  return typeof value === "string" && value in SIGNED_UPLOAD_FOLDERS;
}

/**
 * Admin only (covered by the existing `/api/uploads/:path*` middleware
 * matcher). Returns everything the browser needs to upload the file bytes
 * straight to Cloudinary — this server never sees them. The `fileSize`
 * check is a policy gate at signing time (bytes never actually transit
 * here to be measured), and `allowed_formats` in the signed params makes
 * Cloudinary itself reject anything that isn't a PDF.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { folder, filename, fileSize } = body ?? {};

  if (!isSignedUploadFolder(folder)) {
    throw new ValidationError("Validation failed", {
      fieldErrors: { folder: [`folder must be one of: ${Object.keys(SIGNED_UPLOAD_FOLDERS).join(", ")}`] },
    });
  }
  if (typeof filename !== "string" || filename.trim().length === 0) {
    throw new ValidationError("Validation failed", { fieldErrors: { filename: ["filename is required"] } });
  }

  const config = SIGNED_UPLOAD_FOLDERS[folder];
  if (typeof fileSize !== "number" || fileSize <= 0 || fileSize > config.maxBytes) {
    throw new ValidationError("Validation failed", {
      fieldErrors: { fileSize: [`file must be smaller than ${config.maxBytes / (1024 * 1024)}MB`] },
    });
  }

  const { cloudName, apiKey } = getCloudinaryCredentials();
  const paramsToSign = {
    folder: config.cloudinaryFolder,
    use_filename: true,
    unique_filename: true,
    filename_override: filename,
    allowed_formats: config.allowedFormats,
  };
  const { signature, timestamp } = signUploadParams(paramsToSign);

  return apiSuccess({
    cloudName,
    apiKey,
    resourceType: config.resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${config.resourceType}/upload`,
    params: { ...paramsToSign, timestamp, signature },
  });
});
