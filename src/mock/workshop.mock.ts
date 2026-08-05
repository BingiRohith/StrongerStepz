/**
 * Site-wide landing-page content that ISN'T part of a specific Workshop
 * document — the comparison section, the closing CTA, the footer, and the
 * (still-mocked) live stats bar. Workshop-specific content (hero copy,
 * benefits, agenda, FAQ, pricing) comes from MongoDB via
 * `WorkshopService.getActive()` as of Phase 5 — see `src/app/page.tsx`.
 * Testimonials and doctors come from the `Testimonial`/`Doctor` collections
 * as of Phase 7 — see `src/components/site/TestimonialsSection.tsx` /
 * `DoctorsSection.tsx`. As of Phase 8, the hero/benefits/audience image
 * URLs come from `HomepageImagesService` instead of this file or Workshop.
 * The "Is This For Me?" title + statements come from `AudienceContentService`.
 * The live stats bar's numbers come from `RegistrationService.getStats()` —
 * only its labels stay here.
 */
import type { ComparisonColumn } from "@/types/workshop";

export const siteContent = {
  contactEmail: "strongersteps50@gmail.com",
};

export const comparison: { traditional: ComparisonColumn; strongerSteps: ComparisonColumn } = {
  traditional: {
    title: "Traditional Fitness",
    items: ["Fast paced", "Intimidating", "Young crowd", "Lack of guidance"],
  },
  strongerSteps: {
    title: "Stronger Steps",
    items: ["Guided & Gentle", "Calm & supportive", "Elder-friendly", "Focused on independence", "Community-oriented"],
    highlight: true,
  },
};

export const ctaContent = {
  title: "Strength after 50 is not about becoming young again.",
  subtitle: "It is about:",
  items: ["walking confidently", "living independently", "trusting your body again"],
};

export const footerContent = {
  logoText: "STRONGER STEPS 👨‍⚕️",
  closingText: "Because confidence can still move forward.",
};

export const statsContent = {
  registeredLabel: "Registered Members",
  communityLabel: "Joined WhatsApp & Accessed Tools",
};
