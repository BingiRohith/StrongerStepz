import { v2 as cloudinary } from "cloudinary";

/**
 * Thin wrapper around the Cloudinary SDK, mirroring
 * `src/lib/payments/razorpay.ts`'s "read credentials from `process.env` at
 * call time, cache the configured client" pattern.
 */

export function getCloudinaryCredentials(): { cloudName: string; apiKey: string; apiSecret: string } {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET environment variables are not set"
    );
  }
  return { cloudName, apiKey, apiSecret };
}

let configured = false;

export function getCloudinaryClient(): typeof cloudinary {
  if (!configured) {
    const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    configured = true;
  }
  return cloudinary;
}
