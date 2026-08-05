import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { LimitedSeatsNotice } from "@/components/site/LimitedSeatsNotice";
import type { DoctorDocument } from "@/models/Doctor";

/** `DoctorDocument` with its ObjectId serialized to a string so it can cross the Server → Client Component boundary. */
export type DoctorViewModel = Omit<DoctorDocument, "_id"> & { _id: string };

export interface DoctorsSectionProps {
  badgeText?: string;
  title?: string;
  doctors: DoctorViewModel[];
  onRegisterClick: () => void;
  seatsAvailable: boolean;
}

/**
 * "You Are In Safe Hands" — replaces the old `AboutSection` slot with real
 * doctor profiles from the admin-managed `Doctor` collection, reusing the
 * same image/text section layout. Renders nothing if there are no active
 * doctors.
 */
export function DoctorsSection({
  badgeText = "Meet The Team",
  title = "You Are In Safe Hands",
  doctors,
  onRegisterClick,
  seatsAvailable,
}: DoctorsSectionProps) {
  if (doctors.length === 0) {
    return null;
  }

  return (
    <Section id="doctors" background="light">
      <Container>
        <div className="mb-14 text-center">
          <Badge variant="secondary" className="mb-6">
            {badgeText}
          </Badge>
          <h2 className="font-heading text-4xl text-primary-dark md:text-5xl">{title}</h2>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {doctors.map((doctor) => (
            <div key={doctor._id} className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[1fr_1.2fr]">
              <div className="relative aspect-square overflow-hidden rounded-3xl shadow-lg">
                {doctor.photoUrl ? (
                  <Image
                    src={doctor.photoUrl}
                    alt={doctor.name}
                    fill
                    sizes="(min-width: 1024px) 20vw, 45vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface text-5xl" aria-hidden="true">
                    🩺
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-1 font-heading text-2xl text-primary-dark">{doctor.name}</h3>
                <p className="mb-1 font-heading text-lg font-semibold text-secondary">{doctor.qualification}</p>
                <p className="mb-4 text-sm font-semibold text-ink-muted">{doctor.experience}</p>
                <p className="text-lg leading-relaxed text-ink-muted">{doctor.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button onClick={onRegisterClick}>Register Now</Button>
          <LimitedSeatsNotice seatsAvailable={seatsAvailable} className="mt-3" />
        </div>
      </Container>
    </Section>
  );
}
