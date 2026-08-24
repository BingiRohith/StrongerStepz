import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { ValidationError } from "@/errors/ValidationError";
import { buildFeedbackResponsesWorkbook, buildTimestampedExportFilename } from "@/lib/excel/export";
import { FeedbackFormService } from "@/services/FeedbackFormService";
import { FeedbackResponseService } from "@/services/FeedbackResponseService";
import { RegistrationService } from "@/services/RegistrationService";
import { WorkshopService } from "@/services/WorkshopService";

const formService = new FeedbackFormService();
const responseService = new FeedbackResponseService();
const registrationService = new RegistrationService();
const workshopService = new WorkshopService();

/**
 * Streams an .xlsx file rather than the usual JSON envelope, so this route
 * doesn't use `withErrorHandling`/`apiSuccess` — it does its own try/catch
 * and falls back to the shared `apiError` shape only when something fails.
 * Mirrors `/api/registrations/export`. Columns are derived from the
 * referenced form's `fields[]` at export time (§9 of the plan).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    const formId = request.nextUrl.searchParams.get("formId");
    if (!formId) {
      throw new ValidationError("Validation failed", { fieldErrors: { formId: ["formId is required"] } });
    }

    const workshopId = request.nextUrl.searchParams.get("workshopId") ?? undefined;
    const form = await formService.getById(formId);
    const responses = await responseService.listAll(formId, workshopId);

    const [registrations, workshops] = await Promise.all([registrationService.list(), workshopService.list()]);
    const buffer = await buildFeedbackResponsesWorkbook(form, responses, { registrations: new Map(registrations.map((item) => [item._id.toString(), item])), workshops: new Map(workshops.map((item) => [item._id.toString(), item])) });
    const filename = buildTimestampedExportFilename(form.title);

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
