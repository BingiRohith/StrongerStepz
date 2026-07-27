"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  DynamicFieldListEditor,
  createDynamicField,
  type DynamicField,
  type DynamicFieldType,
} from "@/components/admin/DynamicFieldListEditor";
import type { FeedbackFieldType, FeedbackFormField } from "@/models/FeedbackForm";

export interface FeedbackFormFormInitialValue {
  title?: string;
  description?: string;
  fields?: FeedbackFormField[];
  isActive?: boolean;
}

export interface FeedbackFormFormProps {
  mode: "create" | "edit";
  formId?: string;
  initialValue?: FeedbackFormFormInitialValue;
}

interface FormState {
  title: string;
  description: string;
  fields: DynamicField[];
  isActive: boolean;
}

/**
 * `DynamicFieldListEditor` is a generic form-builder widget with its own
 * type vocabulary, deliberately independent of `FeedbackFieldType` (see the
 * component's own doc comment) — this module owns the mapping at its
 * boundary instead of the shared component importing feedback-specific
 * types. `radio` and `dropdown` are both admin-UI conveniences that collapse
 * to the same `single_select` on the backend, since the model only
 * distinguishes single- vs multi-select, not the exact widget.
 */
const DYNAMIC_TO_FEEDBACK_TYPE: Record<DynamicFieldType, FeedbackFieldType> = {
  text: "text",
  paragraph: "textarea",
  radio: "single_select",
  dropdown: "single_select",
  checkbox: "multi_select",
  rating: "rating",
  yes_no: "boolean",
};

const FEEDBACK_TO_DYNAMIC_TYPE: Record<FeedbackFieldType, DynamicFieldType> = {
  text: "text",
  textarea: "paragraph",
  single_select: "radio",
  multi_select: "checkbox",
  rating: "rating",
  boolean: "yes_no",
};

const TYPES_WITH_OPTIONS: DynamicFieldType[] = ["radio", "checkbox", "dropdown"];

/** A field's `id` doubles as its persisted `key` — stable across edits, unique by construction (`crypto.randomUUID()`), so no separate slug/key input is needed. */
function fieldsToInitialDynamicFields(fields?: FeedbackFormField[]): DynamicField[] {
  if (!fields?.length) return [createDynamicField()];
  return fields.map((field) => ({
    id: field.key,
    label: field.label,
    type: FEEDBACK_TO_DYNAMIC_TYPE[field.type],
    options: field.options,
    required: field.required,
  }));
}

function buildInitialState(initialValue?: FeedbackFormFormInitialValue): FormState {
  return {
    title: initialValue?.title ?? "",
    description: initialValue?.description ?? "",
    fields: fieldsToInitialDynamicFields(initialValue?.fields),
    isActive: initialValue?.isActive ?? true,
  };
}

export function FeedbackFormForm({ mode, formId, initialValue }: FeedbackFormFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(initialValue));
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (form.fields.some((field) => !field.label.trim())) {
      setFormError("Every field needs a question/label.");
      return;
    }
    if (
      form.fields.some(
        (field) => TYPES_WITH_OPTIONS.includes(field.type) && (field.options ?? []).filter((o) => o.trim()).length < 2
      )
    ) {
      setFormError("Radio, checkbox, and dropdown fields need at least 2 non-empty options.");
      return;
    }

    setSubmitting(true);

    const payload = {
      title: form.title,
      description: form.description || undefined,
      isActive: form.isActive,
      fields: form.fields.map((field) => ({
        key: field.id,
        label: field.label,
        type: DYNAMIC_TO_FEEDBACK_TYPE[field.type],
        options: TYPES_WITH_OPTIONS.includes(field.type) ? (field.options ?? []).filter((o) => o.trim()) : undefined,
        required: field.required,
      })),
    };

    try {
      const url = mode === "create" ? "/api/feedback-forms" : `/api/feedback-forms/${formId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        if (body.error?.code === "VALIDATION_ERROR" && body.error.details?.fieldErrors) {
          const messages = Object.values(body.error.details.fieldErrors as Record<string, string[]>).flat();
          setFormError(messages[0] ?? "Validation failed. Please check the form.");
        } else {
          setFormError(body.error?.message ?? "Something went wrong. Please try again.");
        }
        return;
      }

      router.push("/admin/feedback-forms");
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

      <Card className="grid grid-cols-1 gap-5 p-6">
        <Input label="Title" required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Post-Workshop Feedback" />
        <Textarea label="Description" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
        <label className="flex items-center gap-3 font-semibold text-ink">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
          Active
        </label>
      </Card>

      <div>
        <h3 className="mb-4 font-heading text-lg text-primary-dark">Fields</h3>
        <DynamicFieldListEditor fields={form.fields} onChange={(fields) => update("fields", fields)} disabled={submitting} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/feedback-forms")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create Form" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
