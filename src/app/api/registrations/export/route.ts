import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/api/response";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { buildExportFilename, buildRegistrationsWorkbook } from "@/lib/excel/export";
import { RegistrationService } from "@/services/RegistrationService";
import { WorkshopService } from "@/services/WorkshopService";

const workshopService = new WorkshopService();
const registrationService = new RegistrationService();

/**
 * Streams an .xlsx file rather than the usual JSON envelope, so this route
 * doesn't use `withErrorHandling`/`apiSuccess` — it does its own try/catch
 * and falls back to the shared `apiError` shape only when something fails.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request);

    const workshopId = request.nextUrl.searchParams.get("workshopId");
    const workshop = workshopId ? await workshopService.getById(workshopId) : await workshopService.getActive();
    const registrations = await registrationService.list({ workshopId: workshop._id.toString() });

    const workshops = await workshopService.list();
    const buffer = await buildRegistrationsWorkbook(registrations, new Map(workshops.map((item) => [item._id.toString(), item])));
    const filename = buildExportFilename(workshop.title, workshop.date);

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
