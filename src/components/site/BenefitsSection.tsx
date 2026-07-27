import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export interface BenefitsSectionProps {
  title?: string;
  subtitle?: string;
  items: string[];
  imageSrc: string;
  imageAlt: string;
  onRegisterClick: () => void;
}

/** "What You Will Learn" — the takeaway checklist, sourced from the active workshop's `benefits`. */
export function BenefitsSection({
  title = "What You Will Learn",
  subtitle = "Practical knowledge to reclaim your vitality.",
  items,
  imageSrc,
  imageAlt,
  onRegisterClick,
}: BenefitsSectionProps) {
  return (
    <Section>
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-[60px]">
        <div className="order-2 lg:order-1">
          <h2 className="mb-4 font-heading text-4xl text-primary-dark md:text-5xl">{title}</h2>
          <p className="mb-10 text-lg text-ink-muted md:text-xl">{subtitle}</p>
          <ul className="mb-8 flex flex-col gap-5">
            {items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-5 rounded-2xl bg-white px-7 py-5 text-lg font-semibold text-ink shadow-sm transition-all duration-300 ease-brand hover:translate-x-2 hover:shadow-md"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-white"
                >
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Button onClick={onRegisterClick}>Register Now</Button>
        </div>

        <div className="relative order-1 aspect-square overflow-hidden rounded-3xl shadow-lg lg:order-2">
          <Image src={imageSrc} alt={imageAlt} fill sizes="(min-width: 1024px) 35vw, 90vw" className="object-cover" />
        </div>
      </Container>
    </Section>
  );
}
