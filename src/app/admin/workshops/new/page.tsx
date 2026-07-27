import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { WorkshopForm } from "@/components/admin/WorkshopForm";

export default function NewWorkshopPage() {
  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/workshops" pageTitle="Create Workshop" headerActions={<LogoutButton />}>
      <WorkshopForm mode="create" />
    </AdminLayout>
  );
}
