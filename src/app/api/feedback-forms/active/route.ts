import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { FeedbackFormService } from "@/services/FeedbackFormService";

const service = new FeedbackFormService();

/** Public read — the public site fetches the live feedback form definition(s) to render. */
export const GET = withErrorHandling(async () => {
  const forms = await service.getActive();
  return apiSuccess(forms);
});
