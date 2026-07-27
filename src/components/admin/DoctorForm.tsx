"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { UploadField, type UploadFieldValue } from "@/components/admin/UploadField";

export interface DoctorFormInitialValue {
  name?: string;
  qualification?: string;
  experience?: string;
  description?: string;
  photoUrl?: string;
  photoPublicId?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface DoctorFormProps {
  mode: "create" | "edit";
  doctorId?: string;
  initialValue?: DoctorFormInitialValue;
}

interface FormState {
  name: string;
  qualification: string;
  experience: string;
  description: string;
  photo: UploadFieldValue | null;
  isActive: boolean;
  displayOrder: string;
}

function buildInitialState(initialValue?: DoctorFormInitialValue): FormState {
  return {
    name: initialValue?.name ?? "",
    qualification: initialValue?.qualification ?? "",
    experience: initialValue?.experience ?? "",
    description: initialValue?.description ?? "",
    photo:
      initialValue?.photoUrl && initialValue?.photoPublicId
        ? { url: initialValue.photoUrl, publicId: initialValue.photoPublicId }
        : null,
    isActive: initialValue?.isActive ?? true,
    displayOrder: initialValue?.displayOrder !== undefined ? String(initialValue.displayOrder) : "0",
  };
}

export function DoctorForm({ mode, doctorId, initialValue }: DoctorFormProps) {
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
      qualification: form.qualification,
      experience: form.experience,
      description: form.description,
      photoUrl: form.photo?.url,
      photoPublicId: form.photo?.publicId,
      isActive: form.isActive,
      displayOrder: form.displayOrder === "" ? undefined : Number(form.displayOrder),
    };

    try {
      const url = mode === "create" ? "/api/doctors" : `/api/doctors/${doctorId}`;
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

      router.push("/admin/doctors");
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
        <Input label="Name" required value={form.name} onChange={(e) => update("name", e.target.value)} error={fieldErrors.name} placeholder="Dr. Full Name" />
        <Input
          label="Display Order"
          type="number"
          min={0}
          value={form.displayOrder}
          onChange={(e) => update("displayOrder", e.target.value)}
          error={fieldErrors.displayOrder}
        />
        <Input
          label="Qualification"
          required
          value={form.qualification}
          onChange={(e) => update("qualification", e.target.value)}
          error={fieldErrors.qualification}
          placeholder="MBBS, MD (Orthopedics)"
        />
        <Input
          label="Experience"
          required
          value={form.experience}
          onChange={(e) => update("experience", e.target.value)}
          error={fieldErrors.experience}
          placeholder="12+ years"
        />
        <div className="md:col-span-2">
          <Textarea
            label="Description"
            required
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            error={fieldErrors.description}
          />
        </div>
        <div className="md:col-span-2">
          <UploadField
            label="Photo"
            folder="doctors"
            value={form.photo}
            onChange={(value) => update("photo", value)}
            error={fieldErrors.photoUrl ?? fieldErrors.photoPublicId}
          />
        </div>
        <label className="flex items-center gap-3 font-semibold text-ink">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
          Active
        </label>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/doctors")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create Doctor" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
