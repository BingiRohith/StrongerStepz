import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { buildQuestionnaireResponsesWorkbook, buildTimestampedExportFilename } from "@/lib/excel/export";
import { QuestionnaireResponseService } from "@/services/QuestionnaireResponseService";

const service = new QuestionnaireResponseService();

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
    const responses = await service.listAll(registrationId);

    const buffer = await buildQuestionnaireResponsesWorkbook(responses);
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
