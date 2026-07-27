import { notFound } from "next/navigation";
import { FeedbackFormService } from "@/services/FeedbackFormService";
import { NotFoundError } from "@/errors/NotFoundError";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { FeedbackFormForm } from "@/components/admin/FeedbackFormForm";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export default async function EditFeedbackFormPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  let form;
  try {
    form = await new FeedbackFormService().getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/feedback-forms" pageTitle="Edit Feedback Form" headerActions={<LogoutButton />}>
      <FeedbackFormForm
        mode="edit"
        formId={id}
        initialValue={{
          title: form.title,
          description: form.description,
          fields: form.fields,
          isActive: form.isActive,
        }}
      />
    </AdminLayout>
  );
}
