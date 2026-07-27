import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { WorkshopService } from "@/services/WorkshopService";

const service = new WorkshopService();

/**
 * The workshop the public landing page displays. The Server Component that
 * renders the homepage calls `WorkshopService.getActive()` directly rather
 * than fetching this route — this endpoint exists for the future admin
 * dashboard and any other client that needs it over HTTP.
 */
export const GET = withErrorHandling(async () => {
  const workshop = await service.getActive();
  return apiSuccess(workshop);
});
