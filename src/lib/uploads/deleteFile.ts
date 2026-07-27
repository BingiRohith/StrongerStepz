import { getCloudinaryClient } from "@/lib/uploads/cloudinary";
import type { UploadResourceType } from "@/types/upload";

/** Removes a previously-uploaded Cloudinary asset so replaced/deleted files don't accumulate. */
export async function deleteFile(publicId: string, resourceType: UploadResourceType): Promise<void> {
  const cloudinary = getCloudinaryClient();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
