import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { DoctorService } from "@/services/DoctorService";

interface Params {
  id: string;
}

const service = new DoctorService();

export const PATCH = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const doctor = await service.disable(id);
  return apiSuccess(doctor);
});
