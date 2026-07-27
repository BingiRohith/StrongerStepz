import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { ValidationError } from "@/errors/ValidationError";
import { buildFeedbackResponsesWorkbook, buildTimestampedExportFilename } from "@/lib/excel/export";
import { FeedbackFormService } from "@/services/FeedbackFormService";
import { FeedbackResponseService } from "@/services/FeedbackResponseService";

const formService = new FeedbackFormService();
const responseService = new FeedbackResponseService();

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

    const form = await formService.getById(formId);
    const responses = await responseService.listAll(formId);

    const buffer = await buildFeedbackResponsesWorkbook(form, responses);
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
