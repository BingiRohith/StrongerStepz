import { notFound } from "next/navigation";
import { TestimonialService } from "@/services/TestimonialService";
import { NotFoundError } from "@/errors/NotFoundError";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { TestimonialForm } from "@/components/admin/TestimonialForm";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export default async function EditTestimonialPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  let testimonial;
  try {
    testimonial = await new TestimonialService().getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/testimonials" pageTitle="Edit Testimonial" headerActions={<LogoutButton />}>
      <TestimonialForm
        mode="edit"
        testimonialId={id}
        initialValue={{
          name: testimonial.name,
          message: testimonial.message,
          photoUrl: testimonial.photoUrl,
          photoPublicId: testimonial.photoPublicId,
          isActive: testimonial.isActive,
          displayOrder: testimonial.displayOrder,
        }}
      />
    </AdminLayout>
  );
}
