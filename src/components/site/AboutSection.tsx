import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { WorkshopDoctor } from "@/models/Workshop";

export interface AboutSectionProps {
  badgeText?: string;
  title: string;
  doctors: WorkshopDoctor[];
  description: string;
  imageSrc: string;
  imageAlt: string;
  onRegisterClick: () => void;
}

/** "Welcome to Stronger Steps" — the mission statement, with the doctors credited as structured data rather than hand-written prose. */
export function AboutSection({
  badgeText = "Introducing",
  title,
  doctors,
  description,
  imageSrc,
  imageAlt,
  onRegisterClick,
}: AboutSectionProps) {
  const paragraphs = description.split(/\n\s*\n/).filter(Boolean);

  return (
    <Section id="about" background="light">
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-[70px]">
        <div className="relative aspect-square overflow-hidden rounded-3xl shadow-lg">
          <Image src={imageSrc} alt={imageAlt} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
        </div>

        <div>
          <Badge variant="secondary" className="mb-6">
            {badgeText}
          </Badge>
          <h2 className="mb-3 font-heading text-4xl text-primary-dark md:text-5xl">{title}</h2>
          {doctors.length > 0 && (
            <p className="mb-8 font-heading text-lg font-semibold text-secondary">
              Led by {doctors.map((doctor) => doctor.name).join(" & ")}
            </p>
          )}
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-8 text-xl leading-relaxed text-ink-muted">
              {paragraph}
            </p>
          ))}
          <Button onClick={onRegisterClick}>Register Now</Button>
        </div>
      </Container>
    </Section>
  );
}
