import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { RealLifeStoryService } from "@/services/RealLifeStoryService";

interface Params {
  id: string;
}

const service = new RealLifeStoryService();

export const PATCH = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const story = await service.disable(id);
  return apiSuccess(story);
});
