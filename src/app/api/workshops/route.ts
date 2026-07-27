import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { WorkshopService } from "@/services/WorkshopService";
import { createWorkshopSchema, listWorkshopsQuerySchema } from "@/validators/workshop.schema";

const service = new WorkshopService();

export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = parseOrThrow(listWorkshopsQuerySchema, Object.fromEntries(request.nextUrl.searchParams));
  const workshops = await service.list(query);
  return apiSuccess(workshops);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(createWorkshopSchema, body);
  const workshop = await service.create(input);
  return apiSuccess(workshop, 201);
});
