import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/api/response";
import { NotFoundError } from "@/errors/NotFoundError";
import { PdfDocumentService } from "@/services/PdfDocumentService";

interface Params {
  id: string;
}

const service = new PdfDocumentService();

/**
 * Public download proxy — streams the PDF from Cloudinary through our own
 * origin instead of sending the browser straight to a Cloudinary delivery
 * URL. We set Content-Type/Content-Disposition ourselves so the download
 * doesn't depend on Cloudinary's `fl_attachment` transform or on whichever
 * resource-type ACLs the Cloudinary account currently enforces.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const pdf = await service.getById(id);
    if (!pdf.isActive) {
      throw new NotFoundError(`PDF document "${id}" not found`);
    }

    const upstream = await fetch(pdf.fileUrl);
    if (!upstream.ok || !upstream.body) {
      throw new Error(`Upstream PDF fetch failed with status ${upstream.status} for document "${id}"`);
    }

    const filename = `${pdf.title || "workshop-guide"}.pdf`.replace(/"/g, "");
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
