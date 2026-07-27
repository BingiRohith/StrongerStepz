import type { NextRequest } from "next/server";
import { UnauthorizedError } from "@/errors/UnauthorizedError";
import { verifyAdminToken, type AdminTokenPayload } from "@/lib/auth/jwt";
import { getSessionCookieName } from "@/lib/auth/session";

/** Reads and verifies the admin session cookie, throwing `UnauthorizedError` (caught by `withErrorHandling`) if it's missing or invalid. */
export async function requireAdmin(request: NextRequest): Promise<AdminTokenPayload> {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const payload = token ? await verifyAdminToken(token) : null;
  if (!payload) {
    throw new UnauthorizedError();
  }
  return payload;
}
