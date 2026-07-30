import { notFound } from "next/navigation";
import { PaymentService } from "@/services/PaymentService";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatWorkshopDate } from "@/utils/formatWorkshopDate";
import { ContinueToQuestionnaire } from "./ContinueToQuestionnaire";

export const dynamic = "force-dynamic";

interface Params {
  registrationId: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="mb-2 last:mb-0">
      <span className="font-semibold text-ink">{label}:</span> {value}
    </p>
  );
}

export default async function PaymentSuccessPage({ params }: { params: Promise<Params> }) {
  const { registrationId } = await params;
  const context = await new PaymentService().getPaymentContext(registrationId);

  if (!context) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-light px-6 py-16">
      <Card className="w-full max-w-md p-10 text-center">
        <p className="mb-2 text-5xl">✅</p>
        <h1 className="mb-6 font-heading text-2xl text-primary-dark">Payment Successful</h1>

        <div className="mb-8 rounded-2xl bg-surface-light p-5 text-left text-sm">
          <Row label="Registration Number" value={context.registrationNumber} />
          <Row label="Workshop" value={context.workshopTitle} />
          <Row label="Workshop Date" value={formatWorkshopDate(new Date(context.workshopDate))} />
          <Row label="Amount Paid" value={`₹${(context.amount / 100).toLocaleString("en-IN")}`} />
          <Row label="Payment ID" value={context.gatewayPaymentId} />
          <Row label="Payment Time" value={new Date(context.paidAt).toLocaleString("en-IN")} />
        </div>

        {context.whatsappCommunityLink ? (
          <a href={context.whatsappCommunityLink} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="w-full bg-[#25D366] shadow-none hover:bg-[#1ebc59]">
              📱 Join WhatsApp Community
            </Button>
          </a>
        ) : (
          <p className="text-sm text-ink-muted">Your WhatsApp community link will be shared separately.</p>
        )}

        <ContinueToQuestionnaire registrationId={registrationId} />
      </Card>
    </main>
  );
}
