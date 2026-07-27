import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { RegistrationService } from "@/services/RegistrationService";

interface Params {
  id: string;
}

const service = new RegistrationService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const registration = await service.getById(id);
  return apiSuccess(registration);
});
