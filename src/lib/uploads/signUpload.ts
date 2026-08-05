import { getCloudinaryClient, getCloudinaryCredentials } from "@/lib/uploads/cloudinary";

export interface SignUploadResult {
  signature: string;
  timestamp: number;
}

/**
 * Signs a set of Cloudinary upload params for a **direct browser-to-Cloudinary**
 * upload — the file bytes never pass through our own server/Vercel function.
 * `params` must be exactly the non-file, non-`api_key` params the browser
 * will send alongside the file (see Cloudinary's signed-upload docs); the
 * caller is responsible for sending back the identical param values it
 * signed here, or Cloudinary will reject the upload with a signature
 * mismatch.
 */
export function signUploadParams(params: Record<string, string | number | boolean>): SignUploadResult {
  const cloudinary = getCloudinaryClient();
  const { apiSecret } = getCloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ ...params, timestamp }, apiSecret);
  return { signature, timestamp };
}
