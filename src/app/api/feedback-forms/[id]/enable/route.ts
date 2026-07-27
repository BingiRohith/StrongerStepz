import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { FeedbackFormService } from "@/services/FeedbackFormService";

interface Params {
  id: string;
}

const service = new FeedbackFormService();

export const PATCH = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const form = await service.enable(id);
  return apiSuccess(form);
});
