import { notFound } from "next/navigation";
import { PdfDocumentService } from "@/services/PdfDocumentService";
import { NotFoundError } from "@/errors/NotFoundError";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { PdfDocumentForm } from "@/components/admin/PdfDocumentForm";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export default async function EditPdfPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  let pdf;
  try {
    pdf = await new PdfDocumentService().getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/pdfs" pageTitle="Edit PDF" headerActions={<LogoutButton />}>
      <PdfDocumentForm
        mode="edit"
        pdfId={id}
        initialValue={{
          title: pdf.title,
          fileUrl: pdf.fileUrl,
          filePublicId: pdf.filePublicId,
          isActive: pdf.isActive,
        }}
      />
    </AdminLayout>
  );
}
