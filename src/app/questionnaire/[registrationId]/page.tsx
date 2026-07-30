"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const QUESTION1_OPTIONS = [
  "I want to stay healthy as I age.",
  "I have a specific health problem I'd like to improve.",
  "My doctor advised me to learn more.",
  "A family member or friend suggested this workshop.",
  "I want to prevent future health problems.",
  "I want to become stronger and more active.",
  "I'm just curious and want to learn.",
  "Other",
];

const QUESTION2_OPTIONS = [
  "I want to prevent future health problems.",
  "I want to become stronger and more active.",
  "I want to manage an existing health condition.",
  "I'm here for a family member.",
  "I'm a healthcare professional.",
  "Other",
];

const QUESTION3_OPTIONS = [
  "I spend most of my day sitting.",
  "I walk around the house and do light chores.",
  "I walk for at least 30 minutes most days.",
  "I regularly exercise or attend fitness classes.",
  "I do strength training, yoga, or sports regularly.",
];

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: { fieldErrors?: Record<string, string[]> } };
}

interface PdfDocumentView {
  _id: string;
  title: string;
  fileUrl: string;
}

interface RadioQuestionProps {
  legend: ReactNode;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  showOther?: boolean;
  error?: string;
  otherError?: string;
  disabled?: boolean;
}

function RadioQuestion({
  legend,
  name,
  options,
  value,
  onChange,
  otherValue,
  onOtherChange,
  showOther,
  error,
  otherError,
  disabled,
}: RadioQuestionProps) {
  return (
    <fieldset className="text-left">
      <legend className="mb-3 block font-semibold text-ink">{legend}</legend>
      <div className="flex flex-col gap-2.5">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm transition-colors duration-200 has-[:checked]:border-primary has-[:checked]:bg-primary/5 hover:border-primary/40"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              required
              disabled={disabled}
              className="mt-0.5 accent-primary"
            />
            <span className="text-ink">{option}</span>
          </label>
        ))}
      </div>
      {showOther && (
        <Input
          className="mt-3"
          placeholder="Please specify"
          value={otherValue ?? ""}
          onChange={(event) => onOtherChange?.(event.target.value)}
          required
          disabled={disabled}
          error={otherError}
        />
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Fixed, non-configurable 3-question questionnaire shown right after a free
 * registration completes (see RegisterModal). On submit: saves the
 * QuestionnaireResponse, then best-effort fetches the active PDF and starts
 * its download before showing the Thank You state — if there's no active
 * PDF, or the lookup fails, the Thank You state still shows.
 */
export default function QuestionnairePage() {
  const params = useParams<{ registrationId: string }>();
  const registrationId = params.registrationId;

  const [question1Answer, setQuestion1Answer] = useState("");
  const [question1OtherText, setQuestion1OtherText] = useState("");
  const [question2Answer, setQuestion2Answer] = useState("");
  const [question2OtherText, setQuestion2OtherText] = useState("");
  const [question3Answer, setQuestion3Answer] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pdf, setPdf] = useState<PdfDocumentView | null>(null);

  async function beginPdfDownloadAndFinish() {
    try {
      const response = await fetch("/api/pdfs/active");
      const body = (await response.json()) as ApiEnvelope<PdfDocumentView[]>;
      const activePdf = response.ok && body.success ? body.data?.[0] : undefined;

      if (activePdf?.fileUrl) {
        setPdf(activePdf);
        const link = document.createElement("a");
        link.href = `/api/pdfs/${activePdf._id}/download`;
        link.download = activePdf.title || "workshop-guide.pdf";
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch {
      // No active PDF, or the lookup failed — still show Thank You gracefully.
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/questionnaire-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          question1Answer,
          question1OtherText: question1Answer === "Other" ? question1OtherText : undefined,
          question2Answer,
          question2OtherText: question2Answer === "Other" ? question2OtherText : undefined,
          question3Answer,
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

      await beginPdfDownloadAndFinish();
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-light px-4 py-12 sm:px-6 sm:py-16">
      <Card className="w-full max-w-2xl p-6 text-center sm:p-10">
        {submitted ? (
          <div>
            <p className="mb-2 text-5xl">🎉</p>
            <h1 className="mb-3 font-heading text-2xl text-primary-dark">Thank You!</h1>
            <p className="mb-6 text-ink-muted">
              Your registration is complete and your responses have been recorded. We can&apos;t wait to see you at the
              workshop!
            </p>
            {pdf ? (
              <>
                <p className="mb-4 text-sm text-ink-muted">
                  Your workshop guide download should begin automatically. If it doesn&apos;t, use the button below.
                </p>
                <a href={`/api/pdfs/${pdf._id}/download`} rel="noopener noreferrer" download={pdf.title}>
                  <Button size="lg" className="w-full">
                    Download {pdf.title}
                  </Button>
                </a>
              </>
            ) : (
              <p className="text-sm text-ink-muted">See you at the workshop!</p>
            )}
          </div>
        ) : (
          <>
            <h1 className="mb-2 font-heading text-2xl text-primary-dark sm:text-3xl">Just One More Step</h1>
            <p className="mb-8 text-ink-muted">
              Help us tailor the workshop to you by answering these 3 quick questions.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <RadioQuestion
                legend="1. What brings you to this workshop?"
                name="question1Answer"
                options={QUESTION1_OPTIONS}
                value={question1Answer}
                onChange={setQuestion1Answer}
                showOther={question1Answer === "Other"}
                otherValue={question1OtherText}
                onOtherChange={setQuestion1OtherText}
                error={fieldErrors.question1Answer}
                otherError={fieldErrors.question1OtherText}
                disabled={submitting}
              />
              <RadioQuestion
                legend="2. Who are you attending for?"
                name="question2Answer"
                options={QUESTION2_OPTIONS}
                value={question2Answer}
                onChange={setQuestion2Answer}
                showOther={question2Answer === "Other"}
                otherValue={question2OtherText}
                onOtherChange={setQuestion2OtherText}
                error={fieldErrors.question2Answer}
                otherError={fieldErrors.question2OtherText}
                disabled={submitting}
              />
              <RadioQuestion
                legend="3. How active are you currently?"
                name="question3Answer"
                options={QUESTION3_OPTIONS}
                value={question3Answer}
                onChange={setQuestion3Answer}
                error={fieldErrors.question3Answer}
                disabled={submitting}
              />

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
