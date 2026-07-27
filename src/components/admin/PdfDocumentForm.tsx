"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { UploadField, type UploadFieldValue } from "@/components/admin/UploadField";

export interface PdfDocumentFormInitialValue {
  title?: string;
  fileUrl?: string;
  filePublicId?: string;
  isActive?: boolean;
}

export interface PdfDocumentFormProps {
  mode: "create" | "edit";
  pdfId?: string;
  initialValue?: PdfDocumentFormInitialValue;
}

interface FormState {
  title: string;
  file: UploadFieldValue | null;
  isActive: boolean;
}

function buildInitialState(initialValue?: PdfDocumentFormInitialValue): FormState {
  return {
    title: initialValue?.title ?? "",
    file:
      initialValue?.fileUrl && initialValue?.filePublicId
        ? { url: initialValue.fileUrl, publicId: initialValue.filePublicId }
        : null,
    isActive: initialValue?.isActive ?? true,
  };
}

/**
 * Uploading a new file (via `UploadField`'s built-in "Replace" affordance,
 * which just re-opens the file picker and re-runs the same upload) simply
 * changes `form.file` before submit — the resulting PATCH looks identical to
 * any other update. No separate replace action/route exists (§7 of the plan).
 */
export function PdfDocumentForm({ mode, pdfId, initialValue }: PdfDocumentFormProps) {
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
    setFormError(null);
    setFieldErrors({});

    if (!form.file) {
      setFieldErrors({ fileUrl: "Please upload a PDF file." });
      return;
    }

    setSubmitting(true);

    const payload = {
      title: form.title,
      fileUrl: form.file.url,
      filePublicId: form.file.publicId,
      isActive: form.isActive,
    };

    try {
      const url = mode === "create" ? "/api/pdfs" : `/api/pdfs/${pdfId}`;
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

      router.push("/admin/pdfs");
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
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          error={fieldErrors.title}
          placeholder="Workshop Brochure"
        />
        <UploadField
          label="PDF File"
          folder="pdfs"
          required
          value={form.file}
          onChange={(value) => update("file", value)}
          error={fieldErrors.fileUrl ?? fieldErrors.filePublicId}
        />
        <label className="flex items-center gap-3 font-semibold text-ink">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
          Active
        </label>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/pdfs")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create PDF" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
