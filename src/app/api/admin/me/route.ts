import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/** Lets the admin UI ask "who am I logged in as" to render the header/logout button. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const payload = await requireAdmin(request);
  return apiSuccess({ id: payload.sub, email: payload.email, role: payload.role });
});
