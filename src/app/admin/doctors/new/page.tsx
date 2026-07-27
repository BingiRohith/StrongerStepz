import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { DoctorForm } from "@/components/admin/DoctorForm";

export default function NewDoctorPage() {
  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/doctors" pageTitle="Create Doctor" headerActions={<LogoutButton />}>
      <DoctorForm mode="create" />
    </AdminLayout>
  );
}
