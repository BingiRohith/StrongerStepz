import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { DoctorService } from "@/services/DoctorService";
import { reorderDoctorsSchema } from "@/validators/doctor.schema";

const service = new DoctorService();

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { orderedIds } = parseOrThrow(reorderDoctorsSchema, body);
  await service.reorder(orderedIds);
  return apiSuccess({ reordered: true });
});
