import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export interface AudienceSectionProps {
  title: string;
  positives: string[];
  negatives: string[];
  imageSrc: string;
  imageAlt: string;
}

/** "Is This For Me?" — 5 positive vs. 5 negative statements, side by side. */
export function AudienceSection({ title, positives, negatives, imageSrc, imageAlt }: AudienceSectionProps) {
  return (
    <Section background="dark">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-8 font-heading text-4xl text-[#F8FAFC] md:text-5xl">{title}</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div>
                <h3 className="mb-4 text-sm font-bold tracking-wide text-secondary uppercase">This is for you</h3>
                <ul className="flex flex-col gap-4">
                  {positives.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-base font-medium text-white/90">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white"
                      >
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-bold tracking-wide text-white/50 uppercase">This is not for you</h3>
                <ul className="flex flex-col gap-4">
                  {negatives.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-base font-medium text-white/60">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/60"
                      >
                        ✗
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl">
            <Image src={imageSrc} alt={imageAlt} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
