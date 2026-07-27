import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { WorkshopService } from "@/services/WorkshopService";
import { updateWorkshopSchema } from "@/validators/workshop.schema";

interface Params {
  id: string;
}

const service = new WorkshopService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const workshop = await service.getById(id);
  return apiSuccess(workshop);
});

export const PATCH = withParamsErrorHandling<Params>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const input = parseOrThrow(updateWorkshopSchema, body);
  const workshop = await service.update(id, input);
  return apiSuccess(workshop);
});

export const DELETE = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  await service.delete(id);
  return apiSuccess({ deleted: true });
});
