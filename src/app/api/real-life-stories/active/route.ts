import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { RealLifeStoryService } from "@/services/RealLifeStoryService";

const service = new RealLifeStoryService();

/** Public read — the `RealLifeStoriesSection` fetches active stories in display order. */
export const GET = withErrorHandling(async () => {
  const stories = await service.getActiveOrdered();
  return apiSuccess(stories);
});
