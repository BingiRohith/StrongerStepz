import { notFound } from "next/navigation";
import { DoctorService } from "@/services/DoctorService";
import { NotFoundError } from "@/errors/NotFoundError";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { DoctorForm } from "@/components/admin/DoctorForm";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export default async function EditDoctorPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  let doctor;
  try {
    doctor = await new DoctorService().getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/doctors" pageTitle="Edit Doctor" headerActions={<LogoutButton />}>
      <DoctorForm
        mode="edit"
        doctorId={id}
        initialValue={{
          name: doctor.name,
          qualification: doctor.qualification,
          experience: doctor.experience,
          description: doctor.description,
          photoUrl: doctor.photoUrl,
          photoPublicId: doctor.photoPublicId,
          isActive: doctor.isActive,
          displayOrder: doctor.displayOrder,
        }}
      />
    </AdminLayout>
  );
}
