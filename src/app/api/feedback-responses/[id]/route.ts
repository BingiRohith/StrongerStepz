import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { FeedbackResponseService } from "@/services/FeedbackResponseService";

interface Params {
  id: string;
}

const service = new FeedbackResponseService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const response = await service.getById(id);
  return apiSuccess(response);
});
