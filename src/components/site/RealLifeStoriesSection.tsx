import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { RealLifeStoryDocument } from "@/models/RealLifeStory";

/** `RealLifeStoryDocument` with its ObjectId serialized to a string so it can cross the Server → Client Component boundary. */
export type RealLifeStoryViewModel = Omit<RealLifeStoryDocument, "_id"> & { _id: string };

export interface RealLifeStoriesSectionProps {
  title?: string;
  subtitle?: string;
  stories: RealLifeStoryViewModel[];
}

/** Renders the age/location byline, skipping either piece that's missing. */
function formatByline(age: number | undefined, location: string | undefined): string | null {
  const parts = [age ? `Age ${age}` : null, location ?? null].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" • ") : null;
}

/**
 * "Real Life Stories" — sits immediately after `TestimonialsSection`,
 * sourced from the admin-managed `RealLifeStory` collection. Renders
 * nothing if there are no active stories, so the section leaves no empty
 * whitespace on the homepage.
 */
export function RealLifeStoriesSection({
  title = "Real Life Stories",
  subtitle = "Read inspiring experiences from people who transformed their health.",
  stories,
}: RealLifeStoriesSectionProps) {
  if (stories.length === 0) {
    return null;
  }

  return (
    <Section id="real-life-stories" background="light">
      <Container>
        <div className="mb-14 text-center">
          <h2 className="mb-4 font-heading text-4xl text-primary-dark md:text-5xl">{title}</h2>
          <p className="text-lg text-ink-muted md:text-xl">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {stories.map((story) => {
            const byline = formatByline(story.age, story.location);
            const hasImages = Boolean(story.beforeImageUrl || story.afterImageUrl);

            return (
              <article
                key={story._id}
                className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 ease-brand hover:-translate-y-1 hover:shadow-lg"
              >
                {hasImages && (
                  <div className="grid grid-cols-2 gap-px bg-black/5">
                    <div className="relative aspect-square bg-surface-light">
                      {story.beforeImageUrl && (
                        <Image
                          src={story.beforeImageUrl}
                          alt={`${story.name} before`}
                          fill
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="object-cover"
                        />
                      )}
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold tracking-wide text-white">
                        Before
                      </span>
                    </div>
                    <div className="relative aspect-square bg-surface-light">
                      {story.afterImageUrl && (
                        <Image
                          src={story.afterImageUrl}
                          alt={`${story.name} after`}
                          fill
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="object-cover"
                        />
                      )}
                      <span className="absolute bottom-2 left-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold tracking-wide text-white">
                        After
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-8">
                  <h3 className="mb-1 font-heading text-2xl text-primary-dark">{story.title}</h3>
                  <p className="mb-4 font-heading text-base font-semibold text-secondary">
                    {story.name}
                    {byline && <span className="font-body font-normal text-ink-muted"> · {byline}</span>}
                  </p>
                  <p className="whitespace-pre-line text-ink-muted">{story.storyDescription}</p>
                  {story.highlightQuote && (
                    <blockquote className="mt-6 rounded-xl bg-secondary-light px-6 py-5 font-heading text-lg font-semibold text-primary-dark italic">
                      &ldquo;{story.highlightQuote}&rdquo;
                    </blockquote>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
