import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { PdfDocumentForm } from "@/components/admin/PdfDocumentForm";

export default function NewPdfPage() {
  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/pdfs" pageTitle="Upload PDF" headerActions={<LogoutButton />}>
      <PdfDocumentForm mode="create" />
    </AdminLayout>
  );
}
