import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { RegistrationService } from "@/services/RegistrationService";

interface Params {
  id: string;
}

const service = new RegistrationService();

/**
 * Public exception (see middleware) — fired by the questionnaire page when a
 * registrant clicks "Join our WhatsApp Community" after downloading the PDF.
 * Idempotent: marks `joinedCommunity = true`, so repeated clicks/refreshes
 * never double count on the homepage stats bar.
 */
export const PATCH = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  await service.joinCommunity(id);
  return apiSuccess({ joined: true });
});
