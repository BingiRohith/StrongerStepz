"use client";

import { Button } from "@/components/ui/Button";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { useDisclosure } from "@/hooks/useDisclosure";
import { formatWorkshopDate } from "@/utils/formatWorkshopDate";
import { ctaContent, footerContent, siteContent, statsContent } from "@/mock/workshop.mock";
import { AudienceSection } from "@/components/site/AudienceSection";
import type { AudienceContent } from "@/validators/audienceContent.schema";
import { BenefitsSection } from "@/components/site/BenefitsSection";
import { CtaSection } from "@/components/site/CtaSection";
import { DoctorsSection, type DoctorViewModel } from "@/components/site/DoctorsSection";
import { FaqSection } from "@/components/site/FaqSection";
import { Hero } from "@/components/site/Hero";
import { LiveStatsBar } from "@/components/site/LiveStatsBar";
import { PricingSection } from "@/components/site/PricingSection";
import { RegisterModal } from "@/components/site/RegisterModal";
import { TestimonialsSection, type TestimonialViewModel } from "@/components/site/TestimonialsSection";
import type { WorkshopDocument } from "@/models/Workshop";

/** Server-fetched Workshop with its ObjectId serialized to a string so it can cross the Server → Client Component boundary. */
export type WorkshopViewModel = Omit<WorkshopDocument, "_id"> & { _id: string };

export interface LandingPageHomepageImages {
  hero: string;
  benefits: string;
  audience: string;
}

export interface LandingPageProps {
  workshop: WorkshopViewModel;
  testimonials: TestimonialViewModel[];
  doctors: DoctorViewModel[];
  homepageImages: LandingPageHomepageImages;
  audienceContent: AudienceContent;
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
export function LandingPage({ workshop, testimonials, doctors, homepageImages, audienceContent }: LandingPageProps) {
  const registerModal = useDisclosure();

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
        </>
      }
      afterFooter={
        <LiveStatsBar
          stats={statsContent.stats}
          registeredLabel={statsContent.registeredLabel}
          communityLabel={statsContent.communityLabel}
        />
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
      />

      <TestimonialsSection testimonials={testimonials} onRegisterClick={registerModal.open} />

      <DoctorsSection doctors={doctors} onRegisterClick={registerModal.open} />

      <BenefitsSection
        items={workshop.benefits}
        imageSrc={homepageImages.benefits}
        imageAlt="Bright and calm wellness studio"
        onRegisterClick={registerModal.open}
      />

      <AudienceSection
        title={audienceContent.title}
        positives={audienceContent.positives}
        negatives={audienceContent.negatives}
        imageSrc={homepageImages.audience}
        imageAlt="Group of smiling older adults in a support circle"
      />

      <PricingSection
        details={agendaDetails}
        plan={{
          price: workshop.price,
          originalPrice: workshop.originalPrice,
          includes: workshop.passIncludes ?? [],
        }}
        onRegisterClick={registerModal.open}
      />

      <FaqSection items={workshop.faq} />

      <CtaSection
        title={ctaContent.title}
        subtitle={ctaContent.subtitle}
        items={ctaContent.items}
        onRegisterClick={registerModal.open}
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
