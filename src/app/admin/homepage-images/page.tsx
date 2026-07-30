"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { UploadField, type UploadFieldValue } from "@/components/admin/UploadField";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import type { HomepageImages } from "@/validators/homepageImages.schema";

interface FormState {
  hero: UploadFieldValue | null;
  benefits: UploadFieldValue | null;
  audience: UploadFieldValue | null;
}

const EMPTY_FORM: FormState = { hero: null, benefits: null, audience: null };

export default function AdminHomepageImagesPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadImages() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/homepage-images");
      const body = await response.json();
      if (!response.ok || !body.success) {
        setLoadError(body.error?.message ?? "Failed to load homepage images.");
        return;
      }
      const images = body.data as HomepageImages;
      setForm({ hero: images.hero, benefits: images.benefits, audience: images.audience });
    } catch {
      setLoadError("Something went wrong loading homepage images.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/homepage-images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setFormError(body.error?.message ?? "Failed to save homepage images.");
        return;
      }
      setSaved(true);
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/homepage-images" pageTitle="Homepage Images" headerActions={<LogoutButton />}>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : loadError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {loadError}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {formError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formError}
            </p>
          )}
          {saved && (
            <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Homepage images saved.
            </p>
          )}

          <Card className="flex flex-col gap-5 p-6">
            <div>
              <h3 className="font-heading text-lg text-primary-dark">Hero Image</h3>
              <p className="text-sm text-ink-muted">The portrait image on the opening section of the homepage.</p>
            </div>
            <UploadField folder="homepage" value={form.hero} onChange={(value) => update("hero", value)} />
          </Card>

          <Card className="flex flex-col gap-5 p-6">
            <div>
              <h3 className="font-heading text-lg text-primary-dark">Benefits Image</h3>
              <p className="text-sm text-ink-muted">The image next to &quot;What You Will Learn&quot;.</p>
            </div>
            <UploadField folder="homepage" value={form.benefits} onChange={(value) => update("benefits", value)} />
          </Card>

          <Card className="flex flex-col gap-5 p-6">
            <div>
              <h3 className="font-heading text-lg text-primary-dark">Audience Image</h3>
              <p className="text-sm text-ink-muted">The image next to &quot;Is This For Me?&quot;.</p>
            </div>
            <UploadField folder="homepage" value={form.audience} onChange={(value) => update("audience", value)} />
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
