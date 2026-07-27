import { DashboardService } from "@/services/DashboardService";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";

// Depends on live MongoDB data — don't let Next try to prerender it at build time.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const summary = await new DashboardService().getSummary();

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin" pageTitle="Dashboard" headerActions={<LogoutButton />}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Workshops" value={summary.totalWorkshops} />
        <StatCard
          label="Active Workshop"
          value={summary.activeWorkshop ? summary.activeWorkshop.title : "None"}
          hint={summary.activeWorkshop ? new Date(summary.activeWorkshop.date).toLocaleDateString("en-IN") : "No published, featured workshop"}
        />
        <StatCard label="Total Registrations" value={summary.totalRegistrations} />
        <StatCard label="Pending Payments" value={summary.pendingPayments} />
        <StatCard
          label="Remaining Seats"
          value={summary.remainingSeats === null ? "Unlimited" : summary.remainingSeats}
          hint={summary.activeWorkshop ? undefined : "No active workshop"}
        />
      </div>
    </AdminLayout>
  );
}
