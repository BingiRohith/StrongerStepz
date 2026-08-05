import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { LimitedSeatsNotice } from "@/components/site/LimitedSeatsNotice";
import type { TestimonialDocument } from "@/models/Testimonial";

/** `TestimonialDocument` with its ObjectId serialized to a string so it can cross the Server → Client Component boundary. */
export type TestimonialViewModel = Omit<TestimonialDocument, "_id"> & { _id: string };

export interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  testimonials: TestimonialViewModel[];
  onRegisterClick: () => void;
  seatsAvailable: boolean;
}

/**
 * "What Clients Say About Us" — replaces the old `ChallengeSection` slot
 * with real testimonials from the admin-managed `Testimonial` collection,
 * reusing the same card grid structure. Renders nothing if there are no
 * active testimonials.
 */
export function TestimonialsSection({
  title = "What Clients Say About Us",
  subtitle = "Real stories from people who found their strength again.",
  testimonials,
  onRegisterClick,
  seatsAvailable,
}: TestimonialsSectionProps) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <Section id="testimonials">
      <Container>
        <div className="mb-14 text-center">
          <h2 className="mb-4 font-heading text-4xl text-primary-dark md:text-5xl">{title}</h2>
          <p className="text-lg text-ink-muted md:text-xl">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial._id}
              className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-9 text-center shadow-sm transition-all duration-300 ease-brand hover:-translate-y-2 hover:shadow-lg"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-300 ease-brand group-hover:scale-x-100"
              />
              <div className="mx-auto mb-6 flex h-[85px] w-[85px] items-center justify-center overflow-hidden rounded-full bg-surface-light text-4xl">
                {testimonial.photoUrl ? (
                  <Image
                    src={testimonial.photoUrl}
                    alt={testimonial.name}
                    width={85}
                    height={85}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span aria-hidden="true">🙂</span>
                )}
              </div>
              <h3 className="mb-3 font-heading text-2xl text-primary-dark">{testimonial.name}</h3>
              <p className="text-ink-muted">{testimonial.message}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button size="lg" onClick={onRegisterClick}>
            Register Now
          </Button>
          <LimitedSeatsNotice seatsAvailable={seatsAvailable} className="mt-3" />
        </div>
      </Container>
    </Section>
  );
}
