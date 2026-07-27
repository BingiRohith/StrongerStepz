/**
 * Site-wide landing-page content that ISN'T part of a specific Workshop
 * document — the problem/challenge callout, the audience & comparison
 * section, the closing CTA, the footer, and the (still-mocked) live stats
 * bar. Workshop-specific content (hero copy, doctors, benefits, agenda,
 * FAQ, pricing) comes from MongoDB via `WorkshopService.getActive()` as of
 * Phase 5 — see `src/app/page.tsx`.
 */
import type { ChallengeItem, ComparisonColumn, WorkshopStats } from "@/types/workshop";

export const siteContent = {
  contactEmail: "strongersteps50@gmail.com",
};

export const challengeContent = {
  title: "What you missed ?",
  subtitle: "It happens slowly, but you are not alone in this journey.",
  items: [
    { icon: "🦵", title: "Climbing Stairs", description: "Starts feeling harder and requires more breath than it used to." },
    { icon: "🚶", title: "Walking Long Distances", description: "Feels tiring and requires more frequent rests along the way." },
    { icon: "⚖️", title: "Balance", description: "Feels uncertain at times, leading to an increasing fear of falls." },
    { icon: "🛡️", title: "Confidence", description: "Trust in movement slowly reduces, impacting daily activities." },
  ] satisfies ChallengeItem[],
  stopIntro: "Over time, many people silently stop:",
  stopList: ["Walking outside alone", "Social activities and gatherings", "Travelling confidently", "Trusting their own body"],
};

export const audienceContent = {
  title: "Who is this for?",
  tags: [
    "Adults above 50",
    "Low confidence in movement",
    "Afraid of weakness or falls",
    "Families wanting elders to stay active",
  ],
  imageSrc: "/assets/images/community.png",
  imageAlt: "Group of smiling older adults in a support circle",
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
  stats: { registered: 1, community: 1 } satisfies WorkshopStats,
  registeredLabel: "Registered Members",
  communityLabel: "Joined WhatsApp & Accessed Tools",
};
