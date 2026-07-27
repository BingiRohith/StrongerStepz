import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { DoctorService } from "@/services/DoctorService";
import { createDoctorSchema } from "@/validators/doctor.schema";

const service = new DoctorService();

export const GET = withErrorHandling(async () => {
  const doctors = await service.list();
  return apiSuccess(doctors);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(createDoctorSchema, body);
  const doctor = await service.create(input);
  return apiSuccess(doctor, 201);
});
