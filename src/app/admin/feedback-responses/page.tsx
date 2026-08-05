"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import type { FeedbackResponseDocument, FeedbackAnswer } from "@/models/FeedbackResponse";
import type { FeedbackFormDocument, FeedbackFormField } from "@/models/FeedbackForm";
import type { PaginatedResult } from "@/types/pagination";

type FeedbackResponseRow = Omit<
  FeedbackResponseDocument,
  "_id" | "formId" | "registrationId" | "workshopId" | "createdAt" | "updatedAt"
> & {
  _id: string;
  formId: string;
  registrationId?: string;
  workshopId?: string;
  createdAt: string;
};

type FeedbackFormRow = Omit<FeedbackFormDocument, "_id" | "createdAt" | "updatedAt"> & { _id: string };

interface RegistrationLookup {
  _id: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
}

interface WorkshopOption {
  _id: string;
  title: string;
}

const PAGE_SIZE = 10;

function formatAnswerValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default function AdminFeedbackResponsesPage() {
  const [responses, setResponses] = useState<FeedbackResponseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [forms, setForms] = useState<FeedbackFormRow[]>([]);
  const [registrationsById, setRegistrationsById] = useState<Record<string, RegistrationLookup>>({});
  const [workshops, setWorkshops] = useState<WorkshopOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formFilter, setFormFilter] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const formsById = useMemo(() => {
    const map: Record<string, FeedbackFormRow> = {};
    for (const form of forms) map[form._id] = form;
    return map;
  }, [forms]);

  async function loadStaticData() {
    try {
      const [formsRes, registrationsRes, workshopsRes] = await Promise.all([
        fetch("/api/feedback-forms"),
        fetch("/api/registrations"),
        fetch("/api/workshops"),
      ]);
      const formsBody = await formsRes.json();
      if (formsRes.ok && formsBody.success) {
        setForms(formsBody.data);
      }
      const registrationsBody = await registrationsRes.json();
      if (registrationsRes.ok && registrationsBody.success) {
        const lookup: Record<string, RegistrationLookup> = {};
        for (const registration of registrationsBody.data as RegistrationLookup[]) {
          lookup[registration._id] = registration;
        }
        setRegistrationsById(lookup);
      }
      const workshopsBody = await workshopsRes.json();
      if (workshopsRes.ok && workshopsBody.success) {
        setWorkshops(workshopsBody.data);
      }
    } catch {
      // Non-fatal — the responses table still renders with raw ids if this fails.
    }
  }

  async function loadResponses() {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (formFilter) params.set("formId", formFilter);
      if (workshopFilter) params.set("workshopId", workshopFilter);
      const response = await fetch(`/api/feedback-responses?${params.toString()}`);
      const body = await response.json();
      if (!response.ok || !body.success) {
        setLoadError(body.error?.message ?? "Failed to load feedback responses.");
        return;
      }
      const paginated = body.data as PaginatedResult<FeedbackResponseRow>;
      setResponses(paginated.items);
      setTotal(paginated.total);
    } catch {
      setLoadError("Something went wrong loading feedback responses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaticData();
  }, []);

  useEffect(() => {
    loadResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only on page/filter change, not on every render
  }, [page, formFilter, workshopFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const viewingResponse = responses.find((r) => r._id === viewingId) ?? null;
  const viewingForm = viewingResponse ? formsById[viewingResponse.formId] : undefined;
  const viewingRegistration = viewingResponse?.registrationId ? registrationsById[viewingResponse.registrationId] : undefined;

  /** Falls back to the current form's field lookup only for pre-Phase-7 answers that lack a snapshotted `label`. */
  function fieldLabel(answer: FeedbackAnswer, formId: string): string {
    if (answer.label) return answer.label;
    const field = formsById[formId]?.fields.find((f: FeedbackFormField) => f.key === answer.fieldKey);
    return field?.label ?? answer.fieldKey;
  }

  const exportHref = formFilter
    ? `/api/feedback-responses/export?formId=${formFilter}${workshopFilter ? `&workshopId=${workshopFilter}` : ""}`
    : null;

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/feedback-responses" pageTitle="Feedback Responses" headerActions={<LogoutButton />}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            className="sm:w-56"
            value={formFilter}
            onChange={(event) => {
              setFormFilter(event.target.value);
              setPage(1);
            }}
            options={[{ value: "", label: "All Forms" }, ...forms.map((f) => ({ value: f._id, label: f.title }))]}
          />
          <Select
            className="sm:w-56"
            value={workshopFilter}
            onChange={(event) => {
              setWorkshopFilter(event.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "Overall (All Workshops)" },
              ...workshops.map((w) => ({ value: w._id, label: w.title })),
            ]}
          />
        </div>
        {exportHref ? (
          <a href={exportHref}>
            <Button variant="secondary">⬇ Export to Excel</Button>
          </a>
        ) : (
          <Button variant="secondary" disabled title="Select a form to export its responses">
            ⬇ Export to Excel
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : loadError ? (
        <EmptyState title="Couldn't load feedback responses" description={loadError} action={<Button onClick={loadResponses}>Retry</Button>} />
      ) : responses.length === 0 ? (
        <EmptyState title="No feedback responses found" description={formFilter ? "No responses for this form yet." : "Responses will appear here once submitted."} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>Respondent</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response) => {
                const registration = response.registrationId ? registrationsById[response.registrationId] : undefined;
                return (
                  <TableRow key={response._id}>
                    <TableCell className="font-semibold text-ink">{formsById[response.formId]?.title ?? "—"}</TableCell>
                    <TableCell>{registration ? `${registration.name} (${registration.email})` : "Anonymous / not registered"}</TableCell>
                    <TableCell>{new Date(response.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setViewingId(response._id)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <Dialog
        isOpen={viewingResponse !== null}
        onClose={() => setViewingId(null)}
        title="Feedback Response"
        description={viewingResponse ? `${viewingForm?.title ?? "Form"} — submitted ${new Date(viewingResponse.createdAt).toLocaleString("en-IN")}` : undefined}
      >
        {viewingResponse && (
          <div className="flex flex-col gap-5 text-sm">
            <div className="rounded-xl bg-surface-light p-4">
              <h4 className="mb-2 font-heading text-primary-dark">Respondent</h4>
              {viewingRegistration ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt className="text-ink-muted">Name</dt>
                  <dd>{viewingRegistration.name}</dd>
                  <dt className="text-ink-muted">Email</dt>
                  <dd>{viewingRegistration.email}</dd>
                  <dt className="text-ink-muted">Phone</dt>
                  <dd>{viewingRegistration.phone}</dd>
                  <dt className="text-ink-muted">Reg. Number</dt>
                  <dd>{viewingRegistration.registrationNumber}</dd>
                </dl>
              ) : (
                <p className="text-ink-muted">Not linked to a registration.</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {viewingResponse.answers.map((answer: FeedbackAnswer, index: number) => (
                <div key={`${answer.fieldKey}-${index}`}>
                  <h4 className="mb-1 font-semibold text-ink">{fieldLabel(answer, viewingResponse.formId)}</h4>
                  <p className="text-ink-muted">{formatAnswerValue(answer.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </AdminLayout>
  );
}
