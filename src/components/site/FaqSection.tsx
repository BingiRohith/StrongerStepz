import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { WorkshopFaqItem } from "@/models/Workshop";

export interface FaqSectionProps {
  title?: string;
  subtitle?: string;
  items: WorkshopFaqItem[];
}

/**
 * FAQ content now lives on the Workshop document itself (`workshop.faq`) —
 * the legacy static page had no FAQ section at all. Uses native
 * `<details>`/`<summary>` so it's keyboard- and screen-reader-accessible
 * without any JS.
 */
export function FaqSection({
  title = "Frequently Asked Questions",
  subtitle = "Answers to what people usually ask before joining.",
  items,
}: FaqSectionProps) {
  return (
    <Section background="light">
      <Container className="mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 font-heading text-4xl text-primary-dark md:text-5xl">{title}</h2>
          <p className="text-lg text-ink-muted md:text-xl">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl bg-white p-6 shadow-sm open:shadow-md md:p-7"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-lg font-semibold text-ink marker:content-none">
                {item.question}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-2xl leading-none text-primary transition-transform duration-300 ease-brand group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-ink-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
