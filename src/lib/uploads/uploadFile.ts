import { getCloudinaryClient } from "@/lib/uploads/cloudinary";
import type { UploadResourceType, UploadResult } from "@/types/upload";

export interface UploadFileOptions {
  folder: string;
  resourceType: UploadResourceType;
  filename?: string;
}

/** Streams a buffer straight to Cloudinary — no temp files on disk. */
export function uploadFile(buffer: Buffer, options: UploadFileOptions): Promise<UploadResult> {
  const cloudinary = getCloudinaryClient();

  return new Promise<UploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType,
        use_filename: Boolean(options.filename),
        filename_override: options.filename,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          resourceType: options.resourceType,
        });
      }
    );
    uploadStream.end(buffer);
  });
}
