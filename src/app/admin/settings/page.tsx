import { WorkshopService } from "@/services/WorkshopService";
import { NotFoundError } from "@/errors/NotFoundError";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const workshop = await new WorkshopService().getActive().catch((error: unknown) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/settings" pageTitle="Settings" headerActions={<LogoutButton />}>
      {!workshop ? (
        <EmptyState
          title="No active workshop"
          description="Publish and feature a workshop first — Settings edits the one currently shown on the public site."
        />
      ) : (
        <Card className="max-w-2xl p-8">
          <p className="mb-6 text-ink-muted">
            Editing settings for <strong className="text-ink">{workshop.title}</strong>.
          </p>
          <SettingsForm
            workshopId={workshop._id.toString()}
            initialZoomLink={workshop.zoomLink}
            initialWhatsappCommunityLink={workshop.whatsappCommunityLink}
            initialRegistrationLimit={workshop.registrationLimit}
            initialRegistrationOpenDate={workshop.registrationOpenDate?.toISOString()}
            initialRegistrationCloseDate={workshop.registrationCloseDate?.toISOString()}
          />
        </Card>
      )}
    </AdminLayout>
  );
}
