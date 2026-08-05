import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { RealLifeStoryService } from "@/services/RealLifeStoryService";
import { reorderRealLifeStoriesSchema } from "@/validators/realLifeStory.schema";

const service = new RealLifeStoryService();

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { orderedIds } = parseOrThrow(reorderRealLifeStoriesSchema, body);
  await service.reorder(orderedIds);
  return apiSuccess({ reordered: true });
});
