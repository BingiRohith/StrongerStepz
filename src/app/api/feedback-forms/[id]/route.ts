import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { FeedbackFormService } from "@/services/FeedbackFormService";
import { updateFeedbackFormSchema } from "@/validators/feedbackForm.schema";

interface Params {
  id: string;
}

const service = new FeedbackFormService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const form = await service.getById(id);
  return apiSuccess(form);
});

export const PATCH = withParamsErrorHandling<Params>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const input = parseOrThrow(updateFeedbackFormSchema, body);
  const form = await service.update(id, input);
  return apiSuccess(form);
});

export const DELETE = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  await service.delete(id);
  return apiSuccess({ deleted: true });
});
