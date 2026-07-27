import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { FeedbackFormForm } from "@/components/admin/FeedbackFormForm";

export default function NewFeedbackFormPage() {
  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/feedback-forms" pageTitle="Create Feedback Form" headerActions={<LogoutButton />}>
      <FeedbackFormForm mode="create" />
    </AdminLayout>
  );
}
