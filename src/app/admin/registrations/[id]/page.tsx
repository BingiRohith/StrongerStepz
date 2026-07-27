import { notFound } from "next/navigation";
import Link from "next/link";
import { RegistrationService } from "@/services/RegistrationService";
import { WorkshopService } from "@/services/WorkshopService";
import { PaymentRepository } from "@/repositories/PaymentRepository";
import { NotFoundError } from "@/errors/NotFoundError";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  "n/a": "Not Applicable",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

interface Params {
  id: string;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">{label}</p>
      <p className="mt-1 text-lg text-ink">{value}</p>
    </div>
  );
}

export default async function RegistrationDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  let registration;
  try {
    registration = await new RegistrationService().getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  const workshop = await new WorkshopService().getById(registration.workshopId.toString()).catch(() => null);

  const payments = await new PaymentRepository().findByRegistrationId(id);
  // Prefer the paid attempt if one exists; otherwise show the most recent attempt.
  const payment =
    payments.find((p) => p.status === "paid") ??
    [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/registrations" pageTitle="Registration Details" headerActions={<LogoutButton />}>
      <div className="mb-6">
        <Link href="/admin/registrations">
          <Button variant="ghost" size="sm">
            ← Back to Registrations
          </Button>
        </Link>
      </div>

      <Card className="p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-heading text-2xl font-bold text-primary-dark">{registration.registrationNumber}</p>
            <p className="text-ink-muted">{workshop ? workshop.title : "Workshop no longer exists"}</p>
          </div>
          <Badge variant="outline" className="normal-case">
            {STATUS_LABELS[registration.status] ?? registration.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full Name" value={registration.name} />
          <Field label="Mobile Number" value={registration.phone} />
          <Field label="Email" value={registration.email} />
          <Field label="Age" value={String(registration.age)} />
          <Field label="Gender" value={GENDER_LABELS[registration.gender] ?? registration.gender} />
          <Field label="City" value={registration.city} />
          <Field label="Joined WhatsApp Community" value={registration.joinedCommunity ? "Yes" : "No"} />
          <Field label="Registered On" value={new Date(registration.createdAt).toLocaleString("en-IN")} />
        </div>

        <hr className="my-8 border-gray-200" />

        <h2 className="mb-5 font-heading text-lg text-primary-dark">Payment</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Payment Status" value={PAYMENT_STATUS_LABELS[registration.paymentStatus] ?? registration.paymentStatus} />
          <Field label="Payment ID" value={payment?.gatewayPaymentId ?? "—"} />
          <Field label="Amount" value={payment ? `₹${(payment.amount / 100).toLocaleString("en-IN")}` : "—"} />
          <Field label="Payment Date" value={payment?.paidAt ? new Date(payment.paidAt).toLocaleString("en-IN") : "—"} />
        </div>
      </Card>
    </AdminLayout>
  );
}
