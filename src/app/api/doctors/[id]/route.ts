import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { DoctorService } from "@/services/DoctorService";
import { updateDoctorSchema } from "@/validators/doctor.schema";

interface Params {
  id: string;
}

const service = new DoctorService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const doctor = await service.getById(id);
  return apiSuccess(doctor);
});

export const PATCH = withParamsErrorHandling<Params>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const input = parseOrThrow(updateDoctorSchema, body);
  const doctor = await service.update(id, input);
  return apiSuccess(doctor);
});

export const DELETE = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  await service.delete(id);
  return apiSuccess({ deleted: true });
});
