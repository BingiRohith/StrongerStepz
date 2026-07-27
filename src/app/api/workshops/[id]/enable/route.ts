import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { WorkshopService } from "@/services/WorkshopService";

interface Params {
  id: string;
}

const service = new WorkshopService();

export const PATCH = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const workshop = await service.enable(id);
  return apiSuccess(workshop);
});
