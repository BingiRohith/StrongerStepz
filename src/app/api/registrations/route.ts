import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { RegistrationService } from "@/services/RegistrationService";
import { createRegistrationSchema, listRegistrationsQuerySchema } from "@/validators/registration.schema";

const service = new RegistrationService();

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = parseOrThrow(listRegistrationsQuerySchema, Object.fromEntries(request.nextUrl.searchParams));
  const registrations = await service.list(query);
  return apiSuccess(registrations);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(createRegistrationSchema, body);
  const registration = await service.register(input);
  return apiSuccess(registration, 201);
});
