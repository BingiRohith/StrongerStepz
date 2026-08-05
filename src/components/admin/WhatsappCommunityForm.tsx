"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { WhatsappCommunitySettings } from "@/validators/whatsappCommunity.schema";

export interface WhatsappCommunityFormProps {
  initialSettings: WhatsappCommunitySettings;
}

/**
 * Admin-editable CMS control for the "Join our WhatsApp Community" section
 * shown after a registrant downloads the workshop PDF (Phase 7). Distinct
 * from the per-workshop `whatsappCommunityLink` field managed by
 * `SettingsForm` above — see `WhatsappCommunityService` for why these are
 * two separate settings.
 */
export function WhatsappCommunityForm({ initialSettings }: WhatsappCommunityFormProps) {
  const [inviteUrl, setInviteUrl] = useState(initialSettings.inviteUrl);
  const [buttonText, setButtonText] = useState(initialSettings.buttonText);
  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/whatsapp-community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteUrl, buttonText, enabled }),
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
        label="WhatsApp Invite URL"
        type="url"
        value={inviteUrl}
        onChange={(event) => setInviteUrl(event.target.value)}
        placeholder="https://chat.whatsapp.com/..."
      />
      <Input
        label="Button Text"
        value={buttonText}
        onChange={(event) => setButtonText(event.target.value)}
        placeholder="Join our WhatsApp Community"
      />
      <label className="flex items-center gap-3 font-semibold text-ink">
        <input
          type="checkbox"
          className="h-5 w-5 accent-primary"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Show after PDF download
      </label>
      <p className="text-sm text-ink-muted">
        When disabled, or when the invite URL is empty, the whole section is hidden on the questionnaire&apos;s
        thank-you page.
      </p>

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
