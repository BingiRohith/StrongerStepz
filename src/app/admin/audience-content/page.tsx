"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import type { AudienceContent } from "@/validators/audienceContent.schema";

interface FormState {
  title: string;
  positives: string[];
  negatives: string[];
}

const EMPTY_FORM: FormState = { title: "", positives: ["", "", "", "", ""], negatives: ["", "", "", "", ""] };

export default function AdminAudienceContentPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadContent() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/audience-content");
      const body = await response.json();
      if (!response.ok || !body.success) {
        setLoadError(body.error?.message ?? "Failed to load content.");
        return;
      }
      const content = body.data as AudienceContent;
      setForm({ title: content.title, positives: content.positives, negatives: content.negatives });
    } catch {
      setLoadError("Something went wrong loading the content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
  }, []);

  function updateTitle(value: string) {
    setForm((prev) => ({ ...prev, title: value }));
    setSaved(false);
  }

  function updateStatement(field: "positives" | "negatives", index: number, value: string) {
    setForm((prev) => ({ ...prev, [field]: prev[field].map((item, i) => (i === index ? value : item)) }));
    setSaved(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/audience-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setFormError(body.error?.message ?? "Failed to save the content.");
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
    <AdminLayout
      navItems={ADMIN_NAV_ITEMS}
      activeHref="/admin/audience-content"
      pageTitle="Is This For Me?"
      headerActions={<LogoutButton />}
    >
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
              Content saved.
            </p>
          )}

          <Card className="flex flex-col gap-5 p-6">
            <div>
              <h3 className="font-heading text-lg text-primary-dark">Section Title</h3>
              <p className="text-sm text-ink-muted">Heading shown above the two columns on the homepage.</p>
            </div>
            <Input value={form.title} onChange={(e) => updateTitle(e.target.value)} placeholder="Is This For Me?" />
          </Card>

          <Card className="flex flex-col gap-5 p-6">
            <div>
              <h3 className="font-heading text-lg text-primary-dark">This is for you (✓)</h3>
              <p className="text-sm text-ink-muted">Exactly 5 statements describing who the workshop is for.</p>
            </div>
            <div className="flex flex-col gap-3">
              {form.positives.map((statement, index) => (
                <Input
                  key={index}
                  value={statement}
                  onChange={(e) => updateStatement("positives", index, e.target.value)}
                  placeholder={`Positive statement ${index + 1}`}
                />
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-5 p-6">
            <div>
              <h3 className="font-heading text-lg text-primary-dark">This is not for you (✗)</h3>
              <p className="text-sm text-ink-muted">Exactly 5 statements describing who the workshop is not for.</p>
            </div>
            <div className="flex flex-col gap-3">
              {form.negatives.map((statement, index) => (
                <Input
                  key={index}
                  value={statement}
                  onChange={(e) => updateStatement("negatives", index, e.target.value)}
                  placeholder={`Negative statement ${index + 1}`}
                />
              ))}
            </div>
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
