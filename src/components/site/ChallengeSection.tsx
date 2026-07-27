import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { ChallengeItem } from "@/types/workshop";

export interface ChallengeSectionProps {
  title: string;
  subtitle: string;
  items: ChallengeItem[];
  stopIntro: string;
  stopList: string[];
  onRegisterClick: () => void;
}

/** "What you missed?" — the four early-warning-sign cards plus the "people silently stop…" callout. */
export function ChallengeSection({ title, subtitle, items, stopIntro, stopList, onRegisterClick }: ChallengeSectionProps) {
  return (
    <Section id="problem">
      <Container>
        <div className="mb-14 text-center">
          <h2 className="mb-4 font-heading text-4xl text-primary-dark md:text-5xl">{title}</h2>
          <p className="text-lg text-ink-muted md:text-xl">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-9 text-center shadow-sm transition-all duration-300 ease-brand hover:-translate-y-2 hover:shadow-lg"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-300 ease-brand group-hover:scale-x-100"
              />
              <div className="mx-auto mb-6 flex h-[85px] w-[85px] items-center justify-center rounded-full bg-surface-light text-4xl">
                <span aria-hidden="true">{item.icon}</span>
              </div>
              <h3 className="mb-3 font-heading text-2xl text-primary-dark">{item.title}</h3>
              <p className="text-ink-muted">{item.description}</p>
            </div>
          ))}
        </div>

        <Card glass className="mx-auto mt-14 max-w-3xl p-8 text-center md:p-12">
          <p className="mb-6 font-heading text-2xl font-bold text-primary-dark">{stopIntro}</p>
          <ul className="flex flex-wrap justify-center gap-5">
            {stopList.map((entry) => (
              <li key={entry}>
                <Badge variant="outline" className="border-black/5 bg-white font-body text-base font-semibold text-ink-muted normal-case shadow-sm">
                  {entry}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-14 text-center">
          <Button size="lg" onClick={onRegisterClick}>
            Register Now
          </Button>
        </div>
      </Container>
    </Section>
  );
}
