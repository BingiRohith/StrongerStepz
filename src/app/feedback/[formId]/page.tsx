"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Loader } from "@/components/ui/Loader";
import type { FeedbackFormField } from "@/models/FeedbackForm";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: { fieldErrors?: Record<string, string[]> } };
}

interface FeedbackFormView {
  _id: string;
  title: string;
  description?: string;
  fields: FeedbackFormField[];
}

const RATING_SCALE = [1, 2, 3, 4, 5];

interface FieldWrapperProps {
  field: FeedbackFormField;
  error?: string;
  children: ReactNode;
}

function FieldWrapper({ field, error, children }: FieldWrapperProps) {
  return (
    <fieldset className="text-left">
      <legend className="mb-3 block font-semibold text-ink">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </legend>
      {children}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

interface FeedbackFieldInputProps {
  field: FeedbackFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

function FeedbackFieldInput({ field, value, onChange, error, disabled }: FeedbackFieldInputProps) {
  switch (field.type) {
    case "text":
      return (
        <Input
          label={`${field.label}${field.required ? " *" : ""}`}
          value={(value as string) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
          disabled={disabled}
          error={error}
        />
      );

    case "textarea":
      return (
        <Textarea
          label={`${field.label}${field.required ? " *" : ""}`}
          value={(value as string) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
          disabled={disabled}
          error={error}
        />
      );

    case "single_select":
      return (
        <FieldWrapper field={field} error={error}>
          <div className="flex flex-col gap-2.5">
            {(field.options ?? []).map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm transition-colors duration-200 has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:border-primary/40"
              >
                <input
                  type="radio"
                  name={field.key}
                  value={option}
                  checked={value === option}
                  onChange={() => onChange(option)}
                  required={field.required}
                  disabled={disabled}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-ink">{option}</span>
              </label>
            ))}
          </div>
        </FieldWrapper>
      );

    case "multi_select": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <FieldWrapper field={field} error={error}>
          <div className="flex flex-col gap-2.5">
            {(field.options ?? []).map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm transition-colors duration-200 has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:border-primary/40"
              >
                <input
                  type="checkbox"
                  name={field.key}
                  value={option}
                  checked={selected.includes(option)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked ? [...selected, option] : selected.filter((entry) => entry !== option)
                    )
                  }
                  disabled={disabled}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-ink">{option}</span>
              </label>
            ))}
          </div>
        </FieldWrapper>
      );
    }

    case "rating":
      return (
        <FieldWrapper field={field} error={error}>
          <div className="flex flex-wrap gap-3">
            {RATING_SCALE.map((score) => (
              <label
                key={score}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-gray-200 font-semibold transition-colors duration-200 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white hover:border-primary/40"
              >
                <input
                  type="radio"
                  name={field.key}
                  value={score}
                  checked={value === score}
                  onChange={() => onChange(score)}
                  required={field.required}
                  disabled={disabled}
                  className="sr-only"
                />
                {score}
              </label>
            ))}
          </div>
        </FieldWrapper>
      );

    case "boolean":
      return (
        <FieldWrapper field={field} error={error}>
          <div className="flex gap-3">
            {[
              { label: "Yes", val: true },
              { label: "No", val: false },
            ].map((option) => (
              <label
                key={option.label}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold transition-colors duration-200 has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:border-primary/40"
              >
                <input
                  type="radio"
                  name={field.key}
                  checked={value === option.val}
                  onChange={() => onChange(option.val)}
                  required={field.required}
                  disabled={disabled}
                  className="accent-primary"
                />
                {option.label}
              </label>
            ))}
          </div>
        </FieldWrapper>
      );

    default:
      return null;
  }
}

/**
 * Standalone, anonymous public feedback form for one specific `FeedbackForm`
 * (the admin page's "Public Link" points here). No auth, no
 * `registrationId` — open to registered and non-registered visitors alike.
 * 404s (via `/api/feedback-forms/public/[id]`) the moment the form is
 * unpublished, same as any other disabled-resource public link in this app.
 */
export default function FeedbackFormPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FeedbackFormView | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadForm() {
      try {
        const response = await fetch(`/api/feedback-forms/public/${formId}`);
        const body = (await response.json()) as ApiEnvelope<FeedbackFormView>;
        if (!cancelled) {
          setForm(response.ok && body.success ? (body.data ?? null) : null);
        }
      } catch {
        if (!cancelled) setForm(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadForm();
    return () => {
      cancelled = true;
    };
  }, [formId]);

  function updateAnswer(fieldKey: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !form) return;
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/feedback-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: form._id,
          answers: form.fields.map((field) => ({ fieldKey: field.key, value: answers[field.key] })),
        }),
      });

      const body = (await response.json()) as ApiEnvelope<unknown>;

      if (!response.ok || !body.success) {
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

      setSubmitted(true);
      setSubmitting(false);
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-light px-4 py-12 sm:px-6 sm:py-16">
      <Card className="w-full max-w-2xl p-6 text-center sm:p-10">
        {loading ? (
          <Loader />
        ) : submitted ? (
          <div>
            <p className="mb-2 text-5xl">🙏</p>
            <h1 className="mb-3 font-heading text-2xl text-primary-dark">Thank You!</h1>
            <p className="text-ink-muted">Your feedback has been recorded. We appreciate you taking the time.</p>
          </div>
        ) : !form ? (
          <div>
            <h1 className="mb-3 font-heading text-2xl text-primary-dark">Feedback Form Not Available</h1>
            <p className="text-ink-muted">
              This feedback form isn&apos;t open for responses right now. Please check back later or contact the
              organizer.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mb-2 font-heading text-2xl text-primary-dark sm:text-3xl">{form.title}</h1>
            {form.description && <p className="mb-8 text-ink-muted">{form.description}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              {form.fields.map((field) => (
                <FeedbackFieldInput
                  key={field.key}
                  field={field}
                  value={answers[field.key]}
                  onChange={(value) => updateAnswer(field.key, value)}
                  error={fieldErrors[field.key]}
                  disabled={submitting}
                />
              ))}

              {formError && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
