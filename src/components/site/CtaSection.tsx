import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export interface CtaSectionProps {
  title: string;
  subtitle: string;
  items: string[];
  onRegisterClick: () => void;
}

/** Splits `title` on `accentPrefix` so the opening phrase can be styled as a brand accent, e.g. "Strength after 50" in "Strength after 50 is not about becoming young again." */
function renderAccentedTitle(title: string, accentPrefix: string) {
  if (!title.startsWith(accentPrefix)) {
    return <span className="text-[#F8FAFC]">{title}</span>;
  }
  return (
    <>
      <span className="text-secondary">{accentPrefix}</span>
      <span className="text-[#F8FAFC]">{title.slice(accentPrefix.length)}</span>
    </>
  );
}

/** Closing emotional statement, ported from the legacy footer's opening lines, ahead of a final CTA. */
export function CtaSection({ title, subtitle, items, onRegisterClick }: CtaSectionProps) {
  return (
    <Section background="dark" className="pb-12 text-center">
      <Container>
        <h2 className="mx-auto mb-6 max-w-3xl font-heading text-3xl md:text-4xl">
          {renderAccentedTitle(title, "Strength after 50")}
        </h2>
        <p className="mb-6 text-xl font-semibold text-secondary">{subtitle}</p>
        <ul className="mb-12 flex flex-wrap justify-center gap-x-10 gap-y-4">
          {items.map((item, index) => (
            <li key={item} className="relative font-heading text-xl font-semibold">
              {item}
              {index < items.length - 1 && (
                <span aria-hidden="true" className="ml-10 text-secondary">
                  •
                </span>
              )}
            </li>
          ))}
        </ul>
        <Button size="lg" onClick={onRegisterClick}>
          Register Now
        </Button>
      </Container>
    </Section>
  );
}
