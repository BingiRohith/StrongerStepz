"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import type { RegistrationDocument } from "@/models/Registration";

export interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  workshopId: string;
  /** Paid workshops (price > 0) redirect straight to /payment; free workshops go on to the questionnaire. */
  workshopPrice: number;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  age: string;
  gender: string;
  city: string;
  preferredLanguage: string;
}

const initialFormState: FormState = {
  name: "",
  phone: "",
  email: "",
  age: "",
  gender: "",
  city: "",
  preferredLanguage: "",
};

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const preferredLanguageOptions = [
  { value: "Telugu", label: "Telugu" },
  { value: "Hindi", label: "Hindi" },
  { value: "English", label: "English" },
  { value: "Others", label: "Others" },
];

/** Shape of the JSON envelope every API route returns (see src/api/response.ts). */
interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: { fieldErrors?: Record<string, string[]> } };
}

/**
 * Real registration form — collects the required fields and submits to
 * `POST /api/registrations`. Paid workshops (`workshopPrice > 0`) redirect
 * straight to `/payment/[registrationId]` once registered; free workshops
 * go on to `/questionnaire/[registrationId]` instead of an in-modal "Thank You".
 */
export function RegisterModal({ isOpen, onClose, workshopId, workshopPrice }: RegisterModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    setForm(initialFormState);
    setFieldErrors({});
    setFormError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
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
          preferredLanguage: form.preferredLanguage,
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
        setSubmitting(false);
        return;
      }

      if (workshopPrice > 0) {
        router.push(`/payment/${body.data._id}`);
        return;
      }

      // Registration succeeded — the fixed questionnaire comes next, not an
      // in-modal "Thank You". The modal itself is left mounted-but-hidden
      // during navigation; handleClose() resets it if the user ever reopens it.
      router.push(`/questionnaire/${body.data._id}`);
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
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
          disabled={submitting}
        />
        <Input
          label="WhatsApp Number"
          type="tel"
          required
          placeholder="Enter your WhatsApp number"
          autoComplete="tel"
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          error={fieldErrors.phone}
          helperText="Please provide only your WhatsApp number for workshop updates."
          disabled={submitting}
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
          disabled={submitting}
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
          disabled={submitting}
        />
        <Select
          label="Gender"
          required
          placeholder="Select gender"
          options={genderOptions}
          value={form.gender}
          onChange={(event) => updateField("gender", event.target.value)}
          error={fieldErrors.gender}
          disabled={submitting}
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
          disabled={submitting}
        />
        <Select
          label="Preferred Language"
          required
          placeholder="Select preferred language"
          options={preferredLanguageOptions}
          value={form.preferredLanguage}
          onChange={(event) => updateField("preferredLanguage", event.target.value)}
          error={fieldErrors.preferredLanguage}
          disabled={submitting}
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
    </Modal>
  );
}
