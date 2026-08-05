import { cache } from "react";
import type { Metadata } from "next";
import { LandingPage, type WorkshopViewModel } from "@/components/site/LandingPage";
import type { TestimonialViewModel } from "@/components/site/TestimonialsSection";
import type { DoctorViewModel } from "@/components/site/DoctorsSection";
import type { RealLifeStoryViewModel } from "@/components/site/RealLifeStoriesSection";
import { NotFoundError } from "@/errors/NotFoundError";
import { WorkshopService } from "@/services/WorkshopService";
import { RegistrationService } from "@/services/RegistrationService";
import { TestimonialService } from "@/services/TestimonialService";
import { DoctorService } from "@/services/DoctorService";
import { RealLifeStoryService } from "@/services/RealLifeStoryService";
import { HomepageImagesService } from "@/services/HomepageImagesService";
import { AudienceContentService } from "@/services/AudienceContentService";
import type { HomepageImages } from "@/validators/homepageImages.schema";
import type { AudienceContent } from "@/validators/audienceContent.schema";
import type { RegistrationStats } from "@/services/RegistrationService";

/** Falls back to the original static assets until an admin uploads a replacement for that slot. */
const FALLBACK_HOMEPAGE_IMAGES = {
  hero: "/assets/images/hero.png",
  benefits: "/assets/images/studio.png",
  audience: "/assets/images/community.png",
};

// This page now depends on live MongoDB data — force per-request rendering
// instead of Next trying to prerender it (and hit the database) at build time.
export const dynamic = "force-dynamic";

/**
 * `generateMetadata` and the page component both need the active workshop
 * on the same request — `cache()` (React's request-scoped memoization)
 * ensures `WorkshopService.getActive()` (and its MongoDB query) only runs
 * once per request instead of twice.
 */
const getActiveWorkshop = cache(async (): Promise<WorkshopViewModel | null> => {
  try {
    const workshop = await new WorkshopService().getActive();
    return { ...workshop, _id: workshop._id.toString() };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }
    throw error;
  }
});

const getActiveTestimonials = cache(async (): Promise<TestimonialViewModel[]> => {
  const testimonials = await new TestimonialService().getActiveOrdered();
  return testimonials.map((testimonial) => ({ ...testimonial, _id: testimonial._id.toString() }));
});

const getActiveDoctors = cache(async (): Promise<DoctorViewModel[]> => {
  const doctors = await new DoctorService().getActiveOrdered();
  return doctors.map((doctor) => ({ ...doctor, _id: doctor._id.toString() }));
});

const getActiveRealLifeStories = cache(async (): Promise<RealLifeStoryViewModel[]> => {
  const stories = await new RealLifeStoryService().getActiveOrdered();
  return stories.map((story) => ({ ...story, _id: story._id.toString() }));
});

/** Backs the "Limited Seats" CTA notice — hidden once the active workshop's registrationLimit is reached. */
const getSeatsAvailable = cache(async (): Promise<boolean> => {
  const workshop = await getActiveWorkshop();
  if (!workshop) {
    return false;
  }
  return new RegistrationService().hasAvailableSeats(workshop._id, workshop.registrationLimit);
});

const getHomepageImages = cache(async (): Promise<HomepageImages> => {
  return new HomepageImagesService().get();
});

const getAudienceContent = cache(async (): Promise<AudienceContent> => {
  return new AudienceContentService().get();
});

/** Backs the live stats bar — always a fresh DB read (page is `force-dynamic`), never stale. */
const getStats = cache(async (): Promise<RegistrationStats> => {
  return new RegistrationService().getStats();
});

export async function generateMetadata(): Promise<Metadata> {
  const workshop = await getActiveWorkshop();
  if (!workshop) {
    const description = "No workshop is currently scheduled — check back soon.";
    return {
      title: "No Workshop Scheduled",
      description,
      alternates: { canonical: "/" },
      openGraph: { title: "Stronger Steps", description, type: "website" },
      twitter: { card: "summary", title: "Stronger Steps", description },
    };
  }

  const shared = { title: workshop.seoTitle, description: workshop.seoDescription };
  const images = await getHomepageImages();
  const heroImage = images.hero?.url ?? FALLBACK_HOMEPAGE_IMAGES.hero;
  return {
    ...shared,
    alternates: { canonical: "/" },
    openGraph: {
      ...shared,
      type: "website",
      images: [{ url: heroImage, width: 1200, height: 630, alt: workshop.title }],
    },
    twitter: { card: "summary_large_image", ...shared, images: [heroImage] },
  };
}

export default async function Home() {
  const workshop = await getActiveWorkshop();

  if (!workshop) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-light px-6 text-center">
        <h1 className="font-heading text-3xl text-primary-dark">No workshop is currently scheduled</h1>
        <p className="max-w-md text-ink-muted">Please check back soon — we&apos;re preparing the next Stronger Steps workshop.</p>
      </main>
    );
  }

  const [testimonials, doctors, realLifeStories, homepageImages, audienceContent, seatsAvailable, stats] =
    await Promise.all([
      getActiveTestimonials(),
      getActiveDoctors(),
      getActiveRealLifeStories(),
      getHomepageImages(),
      getAudienceContent(),
      getSeatsAvailable(),
      getStats(),
    ]);

  return (
    <LandingPage
      workshop={workshop}
      testimonials={testimonials}
      doctors={doctors}
      realLifeStories={realLifeStories}
      seatsAvailable={seatsAvailable}
      stats={stats}
      homepageImages={{
        hero: homepageImages.hero?.url ?? FALLBACK_HOMEPAGE_IMAGES.hero,
        benefits: homepageImages.benefits?.url ?? FALLBACK_HOMEPAGE_IMAGES.benefits,
        audience: homepageImages.audience?.url ?? FALLBACK_HOMEPAGE_IMAGES.audience,
      }}
      audienceContent={audienceContent}
    />
  );
}
