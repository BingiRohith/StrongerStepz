import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { AudienceContentService } from "@/services/AudienceContentService";
import { updateAudienceContentSchema } from "@/validators/audienceContent.schema";

const service = new AudienceContentService();

export const GET = withErrorHandling(async () => {
  const content = await service.get();
  return apiSuccess(content);
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(updateAudienceContentSchema, body);
  const content = await service.update(input);
  return apiSuccess(content);
});
