"use client";

import { Button } from "@/components/ui/Button";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { useDisclosure } from "@/hooks/useDisclosure";
import { formatWorkshopDate } from "@/utils/formatWorkshopDate";
import { audienceContent, challengeContent, ctaContent, footerContent, siteContent, statsContent } from "@/mock/workshop.mock";
import { AboutSection } from "@/components/site/AboutSection";
import { AudienceSection } from "@/components/site/AudienceSection";
import { BenefitsSection } from "@/components/site/BenefitsSection";
import { ChallengeSection } from "@/components/site/ChallengeSection";
import { CtaSection } from "@/components/site/CtaSection";
import { FaqSection } from "@/components/site/FaqSection";
import { Hero } from "@/components/site/Hero";
import { LiveStatsBar } from "@/components/site/LiveStatsBar";
import { PricingSection } from "@/components/site/PricingSection";
import { RegisterModal } from "@/components/site/RegisterModal";
import type { WorkshopDocument } from "@/models/Workshop";

/** Server-fetched Workshop with its ObjectId serialized to a string so it can cross the Server → Client Component boundary. */
export type WorkshopViewModel = Omit<WorkshopDocument, "_id"> & { _id: string };

export interface LandingPageProps {
  workshop: WorkshopViewModel;
}

/**
 * Client-side orchestrator for the public landing page: owns the
 * register-modal open state (shared by every "Register Now" CTA) and
 * composes each section. Workshop-specific content — hero copy, doctors,
 * benefits, agenda, FAQ, pricing — comes from the `workshop` prop, fetched
 * server-side from MongoDB by `src/app/page.tsx` via `WorkshopService`. The
 * sections that aren't tied to a specific workshop (challenge callout,
 * audience, closing CTA, footer, live stats) still read from
 * `src/mock`.
 */
export function LandingPage({ workshop }: LandingPageProps) {
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
          { label: "The Challenge", href: "#problem" },
          { label: "About Workshop", href: "#about" },
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
        imageSrc={workshop.bannerImage}
        imageAlt={`${workshop.title} banner`}
        discoverHref="#about"
        onRegisterClick={registerModal.open}
      />

      <ChallengeSection
        title={challengeContent.title}
        subtitle={challengeContent.subtitle}
        items={challengeContent.items}
        stopIntro={challengeContent.stopIntro}
        stopList={challengeContent.stopList}
        onRegisterClick={registerModal.open}
      />

      <AboutSection
        title={`Welcome to ${workshop.title}.`}
        doctors={workshop.doctors}
        description={workshop.description}
        imageSrc="/assets/images/balance.png"
        imageAlt="Zen stones balanced perfectly representing stability"
        onRegisterClick={registerModal.open}
      />

      <BenefitsSection
        items={workshop.benefits}
        imageSrc="/assets/images/studio.png"
        imageAlt="Bright and calm wellness studio"
        onRegisterClick={registerModal.open}
      />

      <AudienceSection
        title={audienceContent.title}
        tags={audienceContent.tags}
        imageSrc={audienceContent.imageSrc}
        imageAlt={audienceContent.imageAlt}
      />

      <PricingSection
        details={agendaDetails}
        plan={{
          price: workshop.price,
          originalPrice: workshop.originalPrice,
          includes: workshop.whatsappCommunityLink ? ["Whatsapp Community access"] : [],
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
        workshopTitle={workshop.title}
        workshopDate={workshop.date}
        workshopPrice={workshop.price}
      />
    </PublicLayout>
  );
}
