import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { clearSessionCookie } from "@/lib/auth/session";

export const POST = withErrorHandling(async () => {
  const response = apiSuccess({ loggedOut: true });
  clearSessionCookie(response);
  return response;
});
