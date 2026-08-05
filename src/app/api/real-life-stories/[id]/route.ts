import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { RealLifeStoryService } from "@/services/RealLifeStoryService";
import { updateRealLifeStorySchema } from "@/validators/realLifeStory.schema";

interface Params {
  id: string;
}

const service = new RealLifeStoryService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const story = await service.getById(id);
  return apiSuccess(story);
});

export const PATCH = withParamsErrorHandling<Params>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const input = parseOrThrow(updateRealLifeStorySchema, body);
  const story = await service.update(id, input);
  return apiSuccess(story);
});

export const DELETE = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  await service.delete(id);
  return apiSuccess({ deleted: true });
});
