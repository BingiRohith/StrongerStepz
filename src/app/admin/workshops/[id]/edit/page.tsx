import { notFound } from "next/navigation";
import { WorkshopService } from "@/services/WorkshopService";
import { NotFoundError } from "@/errors/NotFoundError";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { WorkshopForm } from "@/components/admin/WorkshopForm";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export default async function EditWorkshopPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  let workshop;
  try {
    workshop = await new WorkshopService().getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/workshops" pageTitle="Edit Workshop" headerActions={<LogoutButton />}>
      <WorkshopForm
        mode="edit"
        workshopId={id}
        initialValue={{
          title: workshop.title,
          subtitle: workshop.subtitle,
          description: workshop.description,
          date: workshop.date.toISOString(),
          time: workshop.time,
          duration: workshop.duration,
          price: workshop.price,
          originalPrice: workshop.originalPrice,
          doctors: workshop.doctors,
          benefits: workshop.benefits,
          passIncludes: workshop.passIncludes,
          agenda: workshop.agenda,
          faq: workshop.faq,
          zoomLink: workshop.zoomLink,
          whatsappCommunityLink: workshop.whatsappCommunityLink,
          registrationLimit: workshop.registrationLimit,
          registrationOpenDate: workshop.registrationOpenDate?.toISOString(),
          registrationCloseDate: workshop.registrationCloseDate?.toISOString(),
          status: workshop.status,
          featured: workshop.featured,
          seoTitle: workshop.seoTitle,
          seoDescription: workshop.seoDescription,
          slug: workshop.slug,
        }}
      />
    </AdminLayout>
  );
}
