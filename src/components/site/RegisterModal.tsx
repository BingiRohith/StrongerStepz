"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { formatWorkshopDate } from "@/utils/formatWorkshopDate";
import type { RegistrationDocument } from "@/models/Registration";

export interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  workshopId: string;
  workshopTitle: string;
  workshopDate: Date | string;
  /** Paid workshops (price > 0) redirect straight to /payment instead of showing the in-modal confirmation. */
  workshopPrice: number;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  age: string;
  gender: string;
  city: string;
}

const initialFormState: FormState = { name: "", phone: "", email: "", age: "", gender: "", city: "" };

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

/** Shape of the JSON envelope every API route returns (see src/api/response.ts). */
interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: { fieldErrors?: Record<string, string[]> } };
}

/**
 * Real registration form — collects the six required fields and submits to
 * `POST /api/registrations`. Paid workshops (`workshopPrice > 0`) redirect
 * straight to `/payment/[registrationId]` once registered; free workshops
 * show the in-modal confirmation with the generated registration number.
 */
export function RegisterModal({ isOpen, onClose, workshopId, workshopTitle, workshopDate, workshopPrice }: RegisterModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<RegistrationDocument | null>(null);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    setForm(initialFormState);
    setFieldErrors({});
    setFormError(null);
    setRegistration(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          name: form.name,
          phone: form.phone,
          email: form.email,
          age: form.age,
          gender: form.gender,
          city: form.city,
        }),
      });

      const body = (await response.json()) as ApiEnvelope<RegistrationDocument>;

      if (!response.ok || !body.success || !body.data) {
        if (body.error?.code === "VALIDATION_ERROR" && body.error.details?.fieldErrors) {
          const nextFieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(body.error.details.fieldErrors)) {
            if (messages[0]) nextFieldErrors[field] = messages[0];
          }
          setFieldErrors(nextFieldErrors);
        } else {
          setFormError(body.error?.message ?? "Something went wrong. Please try again.");
        }
        return;
      }

      if (workshopPrice > 0) {
        router.push(`/payment/${body.data._id}`);
        return;
      }

      setRegistration(body.data);
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {registration ? (
        <div className="py-6 text-center">
          <p className="mb-2 text-4xl">✅</p>
          <h2 className="mb-2 font-heading text-2xl text-primary-dark">Registration Successful</h2>
          <p className="mb-6 font-heading text-lg font-bold tracking-wide text-secondary">
            {registration.registrationNumber}
          </p>
          <div className="mb-6 rounded-2xl bg-surface-light p-5 text-left text-sm">
            <p className="mb-1">
              <span className="font-semibold text-ink">Workshop:</span> {workshopTitle}
            </p>
            <p>
              <span className="font-semibold text-ink">Date:</span> {formatWorkshopDate(new Date(workshopDate))}
            </p>
          </div>
          <p className="text-ink-muted">
            Your registration has been received — this workshop is free, so there&apos;s nothing more to do. See you there!
          </p>
        </div>
      ) : (
        <>
          <h2 className="mb-2 font-heading text-3xl text-primary-dark">Register Now</h2>
          <p className="mb-8 text-ink-muted">
            Join the workshop and get access to the WhatsApp community &amp; bonus tools.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="Enter your full name"
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              error={fieldErrors.name}
            />
            <Input
              label="Mobile Number"
              type="tel"
              required
              placeholder="Enter your mobile number"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              error={fieldErrors.phone}
            />
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="Enter your email id"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              error={fieldErrors.email}
            />
            <Input
              label="Age"
              type="number"
              required
              min={1}
              max={120}
              placeholder="Enter your age"
              value={form.age}
              onChange={(event) => updateField("age", event.target.value)}
              error={fieldErrors.age}
            />
            <Select
              label="Gender"
              required
              placeholder="Select gender"
              options={genderOptions}
              value={form.gender}
              onChange={(event) => updateField("gender", event.target.value)}
              error={fieldErrors.gender}
            />
            <Input
              label="City"
              type="text"
              required
              placeholder="Enter your city"
              autoComplete="address-level2"
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              error={fieldErrors.city}
            />

            {formError && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-3 w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Registration"}
            </Button>
          </form>
        </>
      )}
    </Modal>
  );
}
