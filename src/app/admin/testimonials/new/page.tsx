import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { TestimonialForm } from "@/components/admin/TestimonialForm";

export default function NewTestimonialPage() {
  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/testimonials" pageTitle="Create Testimonial" headerActions={<LogoutButton />}>
      <TestimonialForm mode="create" />
    </AdminLayout>
  );
}
