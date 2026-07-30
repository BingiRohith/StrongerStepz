import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { FeedbackFormService } from "@/services/FeedbackFormService";

interface Params {
  id: string;
}

const service = new FeedbackFormService();

/** Public exception — the public `/feedback/[formId]` page fetches its form definition here, no session required. 404s unless the form is published. */
export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const form = await service.getPublicById(id);
  return apiSuccess(form);
});
