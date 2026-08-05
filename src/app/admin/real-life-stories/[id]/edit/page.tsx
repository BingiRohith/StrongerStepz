import { notFound } from "next/navigation";
import { RealLifeStoryService } from "@/services/RealLifeStoryService";
import { NotFoundError } from "@/errors/NotFoundError";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { RealLifeStoryForm } from "@/components/admin/RealLifeStoryForm";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export default async function EditRealLifeStoryPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  let story;
  try {
    story = await new RealLifeStoryService().getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/real-life-stories" pageTitle="Edit Real Life Story" headerActions={<LogoutButton />}>
      <RealLifeStoryForm
        mode="edit"
        storyId={id}
        initialValue={{
          name: story.name,
          age: story.age,
          location: story.location,
          title: story.title,
          storyDescription: story.storyDescription,
          beforeImageUrl: story.beforeImageUrl,
          beforeImagePublicId: story.beforeImagePublicId,
          afterImageUrl: story.afterImageUrl,
          afterImagePublicId: story.afterImagePublicId,
          highlightQuote: story.highlightQuote,
          isActive: story.isActive,
          displayOrder: story.displayOrder,
        }}
      />
    </AdminLayout>
  );
}
