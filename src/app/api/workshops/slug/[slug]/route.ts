import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { WorkshopService } from "@/services/WorkshopService";

interface Params {
  slug: string;
}

const service = new WorkshopService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { slug } = await params;
  const workshop = await service.getBySlug(slug);
  return apiSuccess(workshop);
});
