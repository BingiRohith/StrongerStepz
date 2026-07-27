import { cache } from "react";
import type { Metadata } from "next";
import { LandingPage, type WorkshopViewModel } from "@/components/site/LandingPage";
import { NotFoundError } from "@/errors/NotFoundError";
import { WorkshopService } from "@/services/WorkshopService";

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
  return {
    ...shared,
    alternates: { canonical: "/" },
    openGraph: {
      ...shared,
      type: "website",
      images: [{ url: workshop.bannerImage, width: 1200, height: 630, alt: workshop.title }],
    },
    twitter: { card: "summary_large_image", ...shared, images: [workshop.bannerImage] },
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

  return <LandingPage workshop={workshop} />;
}
