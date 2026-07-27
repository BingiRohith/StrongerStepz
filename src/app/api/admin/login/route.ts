import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { AdminService } from "@/services/AdminService";
import { adminLoginSchema } from "@/validators/admin.schema";
import { setSessionCookie } from "@/lib/auth/session";

const service = new AdminService();

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(adminLoginSchema, body);
  const { token, admin } = await service.login(input);

  const response = apiSuccess({ admin });
  setSessionCookie(response, token);
  return response;
});
