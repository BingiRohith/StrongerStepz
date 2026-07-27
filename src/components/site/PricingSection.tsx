import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { WorkshopAgendaItem } from "@/models/Workshop";

export interface PricingPlan {
  title?: string;
  price: number;
  originalPrice?: number;
  includes: string[];
  ctaLabel?: string;
  secureText?: string;
}

export interface PricingSectionProps {
  title?: string;
  subtitle?: string;
  details: WorkshopAgendaItem[];
  plan: PricingPlan;
  onRegisterClick: () => void;
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Workshop agenda list alongside the registration/pricing card. Price display is derived from raw numbers — ₹0 renders as "Giving for Free". */
export function PricingSection({
  title = "Workshop Details",
  subtitle = "Everything you need in one comprehensive session.",
  details,
  plan,
  onRegisterClick,
}: PricingSectionProps) {
  const {
    title: planTitle = "Workshop Registration",
    price,
    originalPrice,
    includes,
    ctaLabel = "Join the Workshop",
    secureText = "🔒 Secure Checkout",
  } = plan;

  return (
    <Section id="pricing">
      <Container className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <div>
          <h2 className="mb-4 font-heading text-4xl text-primary-dark md:text-5xl">{title}</h2>
          <p className="mb-6 text-lg text-ink-muted md:text-xl">{subtitle}</p>
          <ul className="mt-10">
            {details.map((detail) => (
              <li key={detail.text} className="flex items-center gap-5 border-b border-gray-200 py-5 text-xl font-medium">
                <span aria-hidden="true" className="text-3xl">
                  {detail.icon}
                </span>
                {detail.text}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-[30px] border-t-[10px] border-primary bg-white p-10 text-center shadow-lg md:p-14">
          <h3 className="mb-5 font-heading text-2xl">{planTitle}</h3>
          <div className="mb-9 flex items-end justify-center gap-3 font-heading text-4xl font-extrabold text-primary md:text-5xl">
            {originalPrice !== undefined && originalPrice > price && (
              <span className="text-2xl font-semibold text-red-400 line-through">{formatInr(originalPrice)}</span>
            )}
            {price === 0 ? "Giving for Free" : formatInr(price)}
          </div>
          <div className="mb-8 rounded-2xl bg-surface-light p-6 text-left">
            <p className="mb-4 font-heading text-base font-bold">Your pass includes:</p>
            <ul className="flex flex-col gap-2">
              {includes.map((item) => (
                <li key={item} className="flex items-center gap-3 font-medium text-ink-muted">
                  <span aria-hidden="true" className="font-bold text-secondary">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Button size="lg" className="w-full" onClick={onRegisterClick}>
            {ctaLabel}
          </Button>
          <p className="mt-5 text-sm font-semibold text-ink-muted">{secureText}</p>
        </aside>
      </Container>
    </Section>
  );
}
