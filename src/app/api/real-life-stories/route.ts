import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { RealLifeStoryService } from "@/services/RealLifeStoryService";
import { createRealLifeStorySchema } from "@/validators/realLifeStory.schema";

const service = new RealLifeStoryService();

export const GET = withErrorHandling(async () => {
  const stories = await service.list();
  return apiSuccess(stories);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(createRealLifeStorySchema, body);
  const story = await service.create(input);
  return apiSuccess(story, 201);
});
