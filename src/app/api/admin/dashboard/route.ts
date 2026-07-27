import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { DashboardService } from "@/services/DashboardService";

const service = new DashboardService();

export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin(request);
  const summary = await service.getSummary();
  return apiSuccess(summary);
});
