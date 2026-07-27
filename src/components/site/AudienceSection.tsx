import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export interface AudienceSectionProps {
  title: string;
  tags: string[];
  imageSrc: string;
  imageAlt: string;
}

/** "Who is this for?" audience tags. */
export function AudienceSection({ title, tags, imageSrc, imageAlt }: AudienceSectionProps) {
  return (
    <Section background="dark">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-8 font-heading text-4xl text-[#F8FAFC] md:text-5xl">{title}</h2>
            <ul className="flex flex-wrap gap-4">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-lg font-semibold backdrop-blur-sm"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl">
            <Image src={imageSrc} alt={imageAlt} fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
