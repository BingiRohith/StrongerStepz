import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/auth/jwt";
import { getSessionCookieName } from "@/lib/auth/session";

/**
 * A handful of API paths must stay reachable without a session even though
 * their prefix is otherwise admin-only: the public site's "active workshop"
 * and "workshop by slug" reads, the public registration form's POST, the
 * public "active" reads for testimonials/doctors/pdfs/feedback-forms, the
 * public "feedback form by id" read (only returns published forms — see
 * `FeedbackFormService.getPublicById`), and the public
 * questionnaire/feedback submission POSTs. `/api/uploads` gets no
 * exception — admin-only, always. `/api/stats` isn't listed here at all —
 * it's simply not in the matcher below, so it's public by default (same as
 * `/api/payments/*`).
 */
const PUBLIC_API_EXCEPTIONS: Array<{ pattern: RegExp; methods: string[] }> = [
  { pattern: /^\/api\/workshops\/active$/, methods: ["GET"] },
  { pattern: /^\/api\/workshops\/slug\/[^/]+$/, methods: ["GET"] },
  { pattern: /^\/api\/registrations$/, methods: ["POST"] },
  { pattern: /^\/api\/registrations\/[^/]+\/join-community$/, methods: ["PATCH"] },
  { pattern: /^\/api\/testimonials\/active$/, methods: ["GET"] },
  { pattern: /^\/api\/doctors\/active$/, methods: ["GET"] },
  { pattern: /^\/api\/real-life-stories\/active$/, methods: ["GET"] },
  { pattern: /^\/api\/pdfs\/active$/, methods: ["GET"] },
  { pattern: /^\/api\/pdfs\/[^/]+\/download$/, methods: ["GET"] },
  { pattern: /^\/api\/feedback-forms\/active$/, methods: ["GET"] },
  { pattern: /^\/api\/feedback-forms\/public\/[^/]+$/, methods: ["GET"] },
  { pattern: /^\/api\/questionnaire-responses$/, methods: ["POST"] },
  { pattern: /^\/api\/feedback-responses$/, methods: ["POST"] },
  { pattern: /^\/api\/whatsapp-community$/, methods: ["GET"] },
];

function isPublicApiException(pathname: string, method: string): boolean {
  return PUBLIC_API_EXCEPTIONS.some((exception) => exception.pattern.test(pathname) && exception.methods.includes(method));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifyAdminToken(token) : null;

  // Already logged in and visiting the login page — go straight to the dashboard.
  if (pathname === "/admin/login" && session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // The login page/route themselves must stay reachable while logged out.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (isApiRoute && isPublicApiException(pathname, request.method)) {
    return NextResponse.next();
  }

  const requiresAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/workshops") ||
    pathname.startsWith("/api/registrations") ||
    pathname.startsWith("/api/uploads") ||
    pathname.startsWith("/api/testimonials") ||
    pathname.startsWith("/api/doctors") ||
    pathname.startsWith("/api/real-life-stories") ||
    pathname.startsWith("/api/pdfs") ||
    pathname.startsWith("/api/questionnaire-responses") ||
    pathname.startsWith("/api/feedback-forms") ||
    pathname.startsWith("/api/feedback-responses") ||
    pathname.startsWith("/api/homepage-images") ||
    pathname.startsWith("/api/audience-content") ||
    pathname.startsWith("/api/whatsapp-community");

  if (!requiresAuth) {
    return NextResponse.next();
  }

  if (!session) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/workshops/:path*",
    "/api/registrations/:path*",
    "/api/uploads/:path*",
    "/api/testimonials/:path*",
    "/api/doctors/:path*",
    "/api/real-life-stories/:path*",
    "/api/pdfs/:path*",
    "/api/questionnaire-responses/:path*",
    "/api/feedback-forms/:path*",
    "/api/feedback-responses/:path*",
    "/api/homepage-images/:path*",
    "/api/audience-content/:path*",
    "/api/whatsapp-community/:path*",
  ],
};
