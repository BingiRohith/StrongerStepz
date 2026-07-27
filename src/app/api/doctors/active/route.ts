import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { DoctorService } from "@/services/DoctorService";

const service = new DoctorService();

/** Public read — the future `DoctorsSection` fetches active doctors in display order. */
export const GET = withErrorHandling(async () => {
  const doctors = await service.getActiveOrdered();
  return apiSuccess(doctors);
});
