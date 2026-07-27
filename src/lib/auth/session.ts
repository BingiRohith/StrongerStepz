import type { NextResponse } from "next/server";

export function getSessionCookieName(): string {
  return process.env.ADMIN_SESSION_COOKIE_NAME || "ss_admin_session";
}

/** Parses simple "7d" / "12h" / "30m" / "45s" durations into seconds; falls back to 7 days. */
function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) return 60 * 60 * 24 * 7;
  const value = Number(match[1]);
  const unit = match[2];
  const unitSeconds = { s: 1, m: 60, h: 3600, d: 86400 }[unit as "s" | "m" | "h" | "d"];
  return value * unitSeconds;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: parseDurationToSeconds(process.env.JWT_EXPIRES_IN || "7d"),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
