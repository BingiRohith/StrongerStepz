import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { WhatsappCommunityService } from "@/services/WhatsappCommunityService";
import { updateWhatsappCommunitySchema } from "@/validators/whatsappCommunity.schema";

const service = new WhatsappCommunityService();

/** Public exception (see middleware) — the post-download questionnaire page is a client component and needs this over HTTP. */
export const GET = withErrorHandling(async () => {
  const settings = await service.get();
  return apiSuccess(settings);
});

/** Admin only. */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(updateWhatsappCommunitySchema, body);
  const settings = await service.update(input);
  return apiSuccess(settings);
});
