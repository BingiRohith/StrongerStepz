import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { RealLifeStoryForm } from "@/components/admin/RealLifeStoryForm";

export default function NewRealLifeStoryPage() {
  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/real-life-stories" pageTitle="Create Real Life Story" headerActions={<LogoutButton />}>
      <RealLifeStoryForm mode="create" />
    </AdminLayout>
  );
}
