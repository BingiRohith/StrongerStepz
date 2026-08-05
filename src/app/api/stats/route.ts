import { NextResponse } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { RegistrationService } from "@/services/RegistrationService";

const service = new RegistrationService();

/**
 * Public, unauthenticated — backs the homepage live stats bar. Not part of
 * the middleware matcher at all (same precedent as `/api/payments/*`), so
 * no session/cookie check ever runs for it. Always a fresh DB read, and
 * explicitly told not to be cached anywhere (browser, CDN) so the count
 * never goes stale after a registration or a WhatsApp-community join.
 */
export const GET = withErrorHandling(async () => {
  const stats = await service.getStats();
  return NextResponse.json(
    { success: true, data: stats },
    { status: 200, headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
});
