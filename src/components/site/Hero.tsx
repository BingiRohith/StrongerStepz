import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export interface HeroProps {
  title: string;
  badgeText: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  discoverHref: string;
  onRegisterClick: () => void;
}

/**
 * Full-height opening section — badge, lead paragraph, two CTAs, and the
 * portrait hero image. The legacy site's CSS had a `.hero-title` rule but
 * the `<h1>` itself was commented out of the markup — this revives it,
 * driven by the active workshop's title, which also gives the page a real
 * top-level heading for SEO/accessibility.
 */
export function Hero({ title, badgeText, description, imageSrc, imageAlt, discoverHref, onRegisterClick }: HeroProps) {
  return (
    <section
      id="hero"
      className="flex min-h-screen items-center overflow-hidden pt-[90px]"
      style={{
        background:
          "radial-gradient(circle at top right, var(--color-secondary-light) 0%, transparent 60%), radial-gradient(circle at bottom left, rgba(74, 140, 119, 0.1) 0%, transparent 50%)",
      }}
    >
      <Container className="grid grid-cols-1 items-center gap-14 py-16 md:grid-cols-2 md:gap-16">
        <div>
          <h1 className="mb-6 font-heading text-4xl leading-tight text-primary-dark md:text-6xl">{title}</h1>
          <Badge variant="secondary" className="mb-10 px-6 py-2.5 text-base">
            {badgeText}
          </Badge>
          <p className="mb-12 text-lg leading-relaxed text-ink-muted md:text-xl">{description}</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button href={discoverHref} variant="secondary">
              Discover the Workshop
            </Button>
            <Button type="button" variant="primary" onClick={onRegisterClick}>
              Register Now
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="animate-blob-morph absolute -top-8 -right-8 h-[110%] w-[110%] bg-secondary-light opacity-80"
          />
          <div className="relative aspect-square overflow-hidden rounded-3xl shadow-lg">
            <Image src={imageSrc} alt={imageAlt} fill priority sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
          </div>
        </div>
      </Container>
    </section>
  );
}
