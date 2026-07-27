"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface SettingsFormProps {
  workshopId: string;
  initialZoomLink?: string;
  initialWhatsappCommunityLink?: string;
  initialRegistrationLimit?: number | null;
  initialRegistrationOpenDate?: string;
  initialRegistrationCloseDate?: string;
}

function toDateInputValue(date?: string): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function SettingsForm({
  workshopId,
  initialZoomLink,
  initialWhatsappCommunityLink,
  initialRegistrationLimit,
  initialRegistrationOpenDate,
  initialRegistrationCloseDate,
}: SettingsFormProps) {
  const [zoomLink, setZoomLink] = useState(initialZoomLink ?? "");
  const [whatsappCommunityLink, setWhatsappCommunityLink] = useState(initialWhatsappCommunityLink ?? "");
  const [registrationLimit, setRegistrationLimit] = useState(
    initialRegistrationLimit != null ? String(initialRegistrationLimit) : ""
  );
  const [registrationOpenDate, setRegistrationOpenDate] = useState(toDateInputValue(initialRegistrationOpenDate));
  const [registrationCloseDate, setRegistrationCloseDate] = useState(toDateInputValue(initialRegistrationCloseDate));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/workshops/${workshopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoomLink,
          whatsappCommunityLink,
          registrationLimit: registrationLimit === "" ? null : Number(registrationLimit),
          registrationOpenDate: registrationOpenDate || undefined,
          registrationCloseDate: registrationCloseDate || undefined,
        }),
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        setError(body.error?.message ?? "Failed to save settings.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label="Zoom Meeting Link"
        type="url"
        value={zoomLink}
        onChange={(event) => setZoomLink(event.target.value)}
        placeholder="https://zoom.us/j/..."
      />
      <Input
        label="WhatsApp Community Link"
        type="url"
        value={whatsappCommunityLink}
        onChange={(event) => setWhatsappCommunityLink(event.target.value)}
        placeholder="https://chat.whatsapp.com/..."
      />
      <Input
        label="Registration Limit"
        type="number"
        min={1}
        value={registrationLimit}
        onChange={(event) => setRegistrationLimit(event.target.value)}
        placeholder="Leave blank for unlimited"
      />
      <Input
        label="Registration Open Date"
        type="date"
        value={registrationOpenDate}
        onChange={(event) => setRegistrationOpenDate(event.target.value)}
      />
      <Input
        label="Registration Close Date"
        type="date"
        value={registrationCloseDate}
        onChange={(event) => setRegistrationCloseDate(event.target.value)}
      />

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Settings saved.
        </p>
      )}

      <Button type="submit" disabled={submitting} className="self-start">
        {submitting ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
