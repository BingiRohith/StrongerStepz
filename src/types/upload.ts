export type UploadResourceType = "image" | "raw";

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format?: string;
  bytes: number;
  resourceType: UploadResourceType;
}
