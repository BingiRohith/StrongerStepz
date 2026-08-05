"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { UploadField, type UploadFieldValue } from "@/components/admin/UploadField";

export interface RealLifeStoryFormInitialValue {
  name?: string;
  age?: number;
  location?: string;
  title?: string;
  storyDescription?: string;
  beforeImageUrl?: string;
  beforeImagePublicId?: string;
  afterImageUrl?: string;
  afterImagePublicId?: string;
  highlightQuote?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface RealLifeStoryFormProps {
  mode: "create" | "edit";
  storyId?: string;
  initialValue?: RealLifeStoryFormInitialValue;
}

interface FormState {
  name: string;
  age: string;
  location: string;
  title: string;
  storyDescription: string;
  beforeImage: UploadFieldValue | null;
  afterImage: UploadFieldValue | null;
  highlightQuote: string;
  isActive: boolean;
  displayOrder: string;
}

function buildInitialState(initialValue?: RealLifeStoryFormInitialValue): FormState {
  return {
    name: initialValue?.name ?? "",
    age: initialValue?.age !== undefined ? String(initialValue.age) : "",
    location: initialValue?.location ?? "",
    title: initialValue?.title ?? "",
    storyDescription: initialValue?.storyDescription ?? "",
    beforeImage:
      initialValue?.beforeImageUrl && initialValue?.beforeImagePublicId
        ? { url: initialValue.beforeImageUrl, publicId: initialValue.beforeImagePublicId }
        : null,
    afterImage:
      initialValue?.afterImageUrl && initialValue?.afterImagePublicId
        ? { url: initialValue.afterImageUrl, publicId: initialValue.afterImagePublicId }
        : null,
    highlightQuote: initialValue?.highlightQuote ?? "",
    isActive: initialValue?.isActive ?? true,
    displayOrder: initialValue?.displayOrder !== undefined ? String(initialValue.displayOrder) : "0",
  };
}

export function RealLifeStoryForm({ mode, storyId, initialValue }: RealLifeStoryFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(initialValue));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload = {
      name: form.name,
      age: form.age === "" ? undefined : Number(form.age),
      location: form.location === "" ? undefined : form.location,
      title: form.title,
      storyDescription: form.storyDescription,
      beforeImageUrl: form.beforeImage?.url,
      beforeImagePublicId: form.beforeImage?.publicId,
      afterImageUrl: form.afterImage?.url,
      afterImagePublicId: form.afterImage?.publicId,
      highlightQuote: form.highlightQuote === "" ? undefined : form.highlightQuote,
      isActive: form.isActive,
      displayOrder: form.displayOrder === "" ? undefined : Number(form.displayOrder),
    };

    try {
      const url = mode === "create" ? "/api/real-life-stories" : `/api/real-life-stories/${storyId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        if (body.error?.code === "VALIDATION_ERROR" && body.error.details?.fieldErrors) {
          const nextFieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(body.error.details.fieldErrors as Record<string, string[]>)) {
            if (messages[0]) nextFieldErrors[field] = messages[0];
          }
          setFieldErrors(nextFieldErrors);
        } else {
          setFormError(body.error?.message ?? "Something went wrong. Please try again.");
        }
        return;
      }

      router.push("/admin/real-life-stories");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}

      <Card className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
        <Input label="Name" required value={form.name} onChange={(e) => update("name", e.target.value)} error={fieldErrors.name} />
        <Input
          label="Age"
          type="number"
          min={0}
          value={form.age}
          onChange={(e) => update("age", e.target.value)}
          error={fieldErrors.age}
          helperText="Optional"
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          error={fieldErrors.location}
          helperText="Optional"
        />
        <Input
          label="Display Order"
          type="number"
          min={0}
          value={form.displayOrder}
          onChange={(e) => update("displayOrder", e.target.value)}
          error={fieldErrors.displayOrder}
        />
        <div className="md:col-span-2">
          <Input label="Title" required value={form.title} onChange={(e) => update("title", e.target.value)} error={fieldErrors.title} />
        </div>
        <div className="md:col-span-2">
          <Textarea
            label="Story Description"
            required
            rows={6}
            value={form.storyDescription}
            onChange={(e) => update("storyDescription", e.target.value)}
            error={fieldErrors.storyDescription}
          />
        </div>
        <div className="md:col-span-2">
          <Textarea
            label="Highlight Quote"
            rows={2}
            value={form.highlightQuote}
            onChange={(e) => update("highlightQuote", e.target.value)}
            error={fieldErrors.highlightQuote}
          />
        </div>
        <UploadField
          label="Before Image"
          folder="real-life-stories"
          value={form.beforeImage}
          onChange={(value) => update("beforeImage", value)}
          error={fieldErrors.beforeImageUrl ?? fieldErrors.beforeImagePublicId}
        />
        <UploadField
          label="After Image"
          folder="real-life-stories"
          value={form.afterImage}
          onChange={(value) => update("afterImage", value)}
          error={fieldErrors.afterImageUrl ?? fieldErrors.afterImagePublicId}
        />
        <label className="flex items-center gap-3 font-semibold text-ink">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
          Active
        </label>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/real-life-stories")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create Story" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
