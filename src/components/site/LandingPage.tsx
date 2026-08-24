"use client";

import { Button } from "@/components/ui/Button";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { useDisclosure } from "@/hooks/useDisclosure";
import { formatWorkshopDate } from "@/utils/formatWorkshopDate";
import { ctaContent, footerContent, siteContent } from "@/mock/workshop.mock";
import { BenefitsSection } from "@/components/site/BenefitsSection";
import { CtaSection } from "@/components/site/CtaSection";
import { DoctorsSection, type DoctorViewModel } from "@/components/site/DoctorsSection";
import { FaqSection } from "@/components/site/FaqSection";
import { Hero } from "@/components/site/Hero";
import { PricingSection } from "@/components/site/PricingSection";
import { RegisterModal } from "@/components/site/RegisterModal";
import { RealLifeStoriesSection, type RealLifeStoryViewModel } from "@/components/site/RealLifeStoriesSection";
import { TestimonialsSection, type TestimonialViewModel } from "@/components/site/TestimonialsSection";
import type { WorkshopDocument } from "@/models/Workshop";
import type { SocialMediaLink } from "@/validators/socialMedia.schema";

/** Server-fetched Workshop with its ObjectId serialized to a string so it can cross the Server → Client Component boundary. */
export type WorkshopViewModel = Omit<WorkshopDocument, "_id"> & { _id: string };

export interface LandingPageHomepageImages {
  hero: string;
  benefits: string;
}

export interface LandingPageProps {
  workshop: WorkshopViewModel;
  testimonials: TestimonialViewModel[];
  doctors: DoctorViewModel[];
  realLifeStories: RealLifeStoryViewModel[];
  homepageImages: LandingPageHomepageImages;
  /** Whether the active workshop still has open seats — drives the "Limited Seats" CTA notice across every Register/Join button. */
  seatsAvailable: boolean;
  socialMediaLinks: SocialMediaLink[];
}

/** Official brand glyph paths, embedded to avoid adding an icon-library dependency for three footer icons. */
function SocialIcon({ platform }: { platform: SocialMediaLink["platform"] }) {
  const paths: Record<SocialMediaLink["platform"], string> = {
    instagram: "M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-3.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z",
    facebook: "M13.5 22v-8h2.75l.41-3h-3.16V9.09c0-.87.24-1.46 1.49-1.46H16.6V4.95c-.28-.04-1.24-.12-2.36-.12-2.34 0-3.94 1.43-3.94 4.06V11H7.65v3h2.65v8h3.2Z",
    whatsapp: "M20.52 3.48A11.9 11.9 0 0 0 12.07 0C5.5 0 .16 5.34.16 11.91c0 2.1.55 4.15 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.7 1.45h.01c6.56 0 11.9-5.34 11.9-11.91 0-3.18-1.24-6.17-3.45-8.41ZM12.07 21.8a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.9 9.9 0 1 1 8.38 4.62Zm5.43-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47a8.94 8.94 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z",
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current"><path d={paths[platform]} /></svg>;
}

/**
 * Client-side orchestrator for the public landing page: owns the
 * register-modal open state (shared by every "Register Now" CTA) and
 * composes each section. Workshop-specific content — hero copy, benefits,
 * agenda, FAQ, pricing — comes from the `workshop` prop; `testimonials` and
 * `doctors` come from the `Testimonial`/`Doctor` collections — all fetched
 * server-side by `src/app/page.tsx`. The sections that aren't tied to a
 * specific workshop (audience, closing CTA, footer, live stats) still read
 * from `src/mock`. The hero/benefits/audience images come from the
 * admin-managed `homepageImages` Settings row (Phase 8) via `homepageImages`.
 */
export function LandingPage({
  workshop,
  testimonials,
  doctors,
  realLifeStories,
  homepageImages,
  seatsAvailable,
  socialMediaLinks: socialMediaLinksProp,
}: LandingPageProps) {
  const registerModal = useDisclosure();
  const socialMediaLinks = Array.isArray(socialMediaLinksProp)
    ? socialMediaLinksProp.filter((link): link is SocialMediaLink => Boolean(link) && typeof link === "object" && link.enabled === true && typeof link.id === "string" && typeof link.url === "string")
    : [];

  const agendaDetails = [
    ...workshop.agenda,
    { icon: "⏱️", text: `Duration: ${workshop.duration}` },
    ...(workshop.whatsappCommunityLink ? [{ icon: "📱", text: "WhatsApp community access" }] : []),
    ...(workshop.zoomLink ? [{ icon: "🔗", text: "Join via Zoom" }] : []),
    ...(workshop.registrationLimit ? [{ icon: "🎟️", text: `Limited to ${workshop.registrationLimit} seats` }] : []),
    { icon: "✉️", text: siteContent.contactEmail },
  ];

  return (
    <PublicLayout
      navbarProps={{
        navItems: [
          { label: "Testimonials", href: "#testimonials" },
          { label: "Our Doctors", href: "#doctors" },
        ],
        cta: (
          <Button href="#pricing" size="sm">
            Join Now
          </Button>
        ),
      }}
      footer={
        <>
          <span className="font-heading text-2xl font-extrabold tracking-wider">{footerContent.logoText}</span>
          <p className="mt-5 text-sm text-white/60 italic">{footerContent.closingText}</p>
          {socialMediaLinks.length > 0 && <div className="mt-6 flex justify-center gap-4">{socialMediaLinks.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.platform} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"><SocialIcon platform={link.platform} />{link.platform === "instagram" ? "Instagram" : link.platform === "facebook" ? "Facebook" : "WhatsApp"}</a>)}</div>}
        </>
      }
    >
      <Hero
        title={workshop.title}
        badgeText={`🗓️ Workshop on ${formatWorkshopDate(new Date(workshop.date))} from ${workshop.time}`}
        description={workshop.subtitle}
        imageSrc={homepageImages.hero}
        imageAlt={`${workshop.title} banner`}
        discoverHref="#doctors"
        onRegisterClick={registerModal.open}
        seatsAvailable={seatsAvailable}
        limitedSeatsEnabled={workshop.limitedSeatsEnabled}
        limitedSeats={workshop.limitedSeats}
      />

      <TestimonialsSection testimonials={testimonials} onRegisterClick={registerModal.open} seatsAvailable={seatsAvailable} limitedSeatsEnabled={workshop.limitedSeatsEnabled} limitedSeats={workshop.limitedSeats} />

      <RealLifeStoriesSection stories={realLifeStories} />

      <DoctorsSection doctors={doctors} onRegisterClick={registerModal.open} seatsAvailable={seatsAvailable} limitedSeatsEnabled={workshop.limitedSeatsEnabled} limitedSeats={workshop.limitedSeats} />

      <BenefitsSection
        items={workshop.benefits}
        imageSrc={homepageImages.benefits}
        imageAlt="Bright and calm wellness studio"
        onRegisterClick={registerModal.open}
        seatsAvailable={seatsAvailable}
        limitedSeatsEnabled={workshop.limitedSeatsEnabled}
        limitedSeats={workshop.limitedSeats}
      />

      <PricingSection
        details={agendaDetails}
        plan={{
          price: workshop.price,
          originalPrice: workshop.originalPrice,
          includes: workshop.passIncludes ?? [],
        }}
        onRegisterClick={registerModal.open}
        seatsAvailable={seatsAvailable}
        limitedSeatsEnabled={workshop.limitedSeatsEnabled}
        limitedSeats={workshop.limitedSeats}
      />

      <FaqSection items={workshop.faq} />

      <CtaSection
        title={ctaContent.title}
        subtitle={ctaContent.subtitle}
        items={ctaContent.items}
        onRegisterClick={registerModal.open}
        seatsAvailable={seatsAvailable}
        limitedSeatsEnabled={workshop.limitedSeatsEnabled}
        limitedSeats={workshop.limitedSeats}
      />

      <RegisterModal
        isOpen={registerModal.isOpen}
        onClose={registerModal.close}
        workshopId={workshop._id}
        workshopPrice={workshop.price}
      />
    </PublicLayout>
  );
}
