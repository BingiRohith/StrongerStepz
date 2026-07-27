import { SignJWT, jwtVerify } from "jose";

/**
 * Uses `jose` rather than `jsonwebtoken` specifically because this needs to
 * verify tokens inside `middleware.ts`, which runs on the Edge runtime —
 * `jsonwebtoken` depends on Node's `crypto` module and doesn't work there.
 */
export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

/** Returns null (never throws) on a missing, malformed, expired, or mis-signed token — callers just check for null. */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return { sub: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
