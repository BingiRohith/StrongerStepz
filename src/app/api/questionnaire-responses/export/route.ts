import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { buildQuestionnaireResponsesWorkbook, buildTimestampedExportFilename } from "@/lib/excel/export";
import { QuestionnaireResponseService } from "@/services/QuestionnaireResponseService";
import { RegistrationService } from "@/services/RegistrationService";
import { WorkshopService } from "@/services/WorkshopService";

const service = new QuestionnaireResponseService();
const registrationService = new RegistrationService();
const workshopService = new WorkshopService();

/**
 * Streams an .xlsx file rather than the usual JSON envelope, so this route
 * doesn't use `withErrorHandling`/`apiSuccess` — it does its own try/catch
 * and falls back to the shared `apiError` shape only when something fails.
 * Mirrors `/api/registrations/export`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    const registrationId = request.nextUrl.searchParams.get("registrationId") ?? undefined;
    const workshopId = request.nextUrl.searchParams.get("workshopId") ?? undefined;
    const responses = await service.listAll(registrationId, workshopId);

    const [registrations, workshops] = await Promise.all([registrationService.list(), workshopService.list()]);
    const buffer = await buildQuestionnaireResponsesWorkbook(responses, { registrations: new Map(registrations.map((item) => [item._id.toString(), item])), workshops: new Map(workshops.map((item) => [item._id.toString(), item])) });
    const filename = buildTimestampedExportFilename("Questionnaire-Responses");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
