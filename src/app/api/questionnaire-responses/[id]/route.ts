import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { QuestionnaireResponseService } from "@/services/QuestionnaireResponseService";

interface Params {
  id: string;
}

const service = new QuestionnaireResponseService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const response = await service.getById(id);
  return apiSuccess(response);
});

export const DELETE = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  await service.delete(id);
  return apiSuccess({ deleted: true });
});
