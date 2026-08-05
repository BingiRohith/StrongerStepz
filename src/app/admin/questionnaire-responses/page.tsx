"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import type { QuestionnaireResponseDocument } from "@/models/QuestionnaireResponse";
import type { PaginatedResult } from "@/types/pagination";
import { QUESTIONNAIRE_PROMPTS } from "@/lib/constants/questionnaire";

type QuestionnaireResponseRow = Omit<
  QuestionnaireResponseDocument,
  "_id" | "registrationId" | "workshopId" | "createdAt" | "updatedAt"
> & {
  _id: string;
  registrationId: string;
  workshopId?: string;
  createdAt: string;
};

interface RegistrationLookup {
  _id: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  city: string;
  age: number;
}

interface WorkshopOption {
  _id: string;
  title: string;
}

const PAGE_SIZE = 10;
/**
 * Admin search needs to run over the full result set, but the underlying
 * API paginates for real (§11 of the plan — this collection is unbounded).
 * Fetching one generous page and filtering/paginating client-side (same
 * pattern as `/admin/registrations`) keeps search working without adding a
 * server-side text-search endpoint. Revisit with true server-side search if
 * submissions ever exceed this.
 */
const FETCH_LIMIT = 500;

export default function AdminQuestionnaireResponsesPage() {
  const [responses, setResponses] = useState<QuestionnaireResponseRow[]>([]);
  const [registrationsById, setRegistrationsById] = useState<Record<string, RegistrationLookup>>({});
  const [workshops, setWorkshops] = useState<WorkshopOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ limit: String(FETCH_LIMIT) });
      if (workshopFilter) params.set("workshopId", workshopFilter);

      const [responsesRes, registrationsRes, workshopsRes] = await Promise.all([
        fetch(`/api/questionnaire-responses?${params.toString()}`),
        fetch("/api/registrations"),
        fetch("/api/workshops"),
      ]);
      const responsesBody = await responsesRes.json();
      if (!responsesRes.ok || !responsesBody.success) {
        setLoadError(responsesBody.error?.message ?? "Failed to load questionnaire responses.");
        return;
      }
      const paginated = responsesBody.data as PaginatedResult<QuestionnaireResponseRow>;
      setResponses(paginated.items);

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
      setLoadError("Something went wrong loading questionnaire responses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only on workshop filter change, not on every render
  }, [workshopFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return responses;
    return responses.filter((response) => {
      const registration = registrationsById[response.registrationId];
      return (
        registration?.name.toLowerCase().includes(term) ||
        registration?.email.toLowerCase().includes(term) ||
        registration?.phone.toLowerCase().includes(term) ||
        registration?.registrationNumber.toLowerCase().includes(term) ||
        response.question1Answer.toLowerCase().includes(term) ||
        response.question2Answer.toLowerCase().includes(term) ||
        response.question3Answer.toLowerCase().includes(term)
      );
    });
  }, [responses, registrationsById, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const viewingResponse = responses.find((r) => r._id === viewingId) ?? null;
  const viewingRegistration = viewingResponse ? registrationsById[viewingResponse.registrationId] : undefined;
  const exportHref = workshopFilter
    ? `/api/questionnaire-responses/export?workshopId=${workshopFilter}`
    : "/api/questionnaire-responses/export";

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setActionError(null);
    try {
      const response = await fetch(`/api/questionnaire-responses/${pendingDeleteId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to delete response.");
        return;
      }
      setPendingDeleteId(null);
      await loadData();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  return (
    <AdminLayout
      navItems={ADMIN_NAV_ITEMS}
      activeHref="/admin/questionnaire-responses"
      pageTitle="Questionnaire Responses"
      headerActions={<LogoutButton />}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBar
            className="sm:w-64"
            placeholder="Search name, email, phone, reg #…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
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
        <a href={exportHref}>
          <Button variant="secondary">⬇ Export to Excel</Button>
        </a>
      </div>

      {actionError && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : loadError ? (
        <EmptyState title="Couldn't load questionnaire responses" description={loadError} action={<Button onClick={loadData}>Retry</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No questionnaire responses found" description={search ? "Try a different search term." : "Responses will appear here once submitted."} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((response) => {
                const registration = registrationsById[response.registrationId];
                return (
                  <TableRow key={response._id}>
                    <TableCell className="font-semibold">{registration?.registrationNumber ?? "—"}</TableCell>
                    <TableCell>{registration?.name ?? "Unknown registrant"}</TableCell>
                    <TableCell>{registration?.email ?? "—"}</TableCell>
                    <TableCell>{new Date(response.createdAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setViewingId(response._id)}>
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(response._id)}>
                          Delete
                        </Button>
                      </div>
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
        title="Questionnaire Response"
        description={viewingResponse ? `Submitted ${new Date(viewingResponse.createdAt).toLocaleString("en-IN")}` : undefined}
      >
        {viewingResponse && (
          <div className="flex flex-col gap-5 text-sm">
            <div className="rounded-xl bg-surface-light p-4">
              <h4 className="mb-2 font-heading text-primary-dark">Registrant</h4>
              {viewingRegistration ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt className="text-ink-muted">Name</dt>
                  <dd>{viewingRegistration.name}</dd>
                  <dt className="text-ink-muted">Email</dt>
                  <dd>{viewingRegistration.email}</dd>
                  <dt className="text-ink-muted">Phone</dt>
                  <dd>{viewingRegistration.phone}</dd>
                  <dt className="text-ink-muted">City</dt>
                  <dd>{viewingRegistration.city}</dd>
                  <dt className="text-ink-muted">Reg. Number</dt>
                  <dd>{viewingRegistration.registrationNumber}</dd>
                </dl>
              ) : (
                <p className="text-ink-muted">Registration record not found (id: {viewingResponse.registrationId}).</p>
              )}
            </div>

            <div>
              <h4 className="mb-1 font-semibold text-ink">{viewingResponse.question1Text ?? QUESTIONNAIRE_PROMPTS.question1}</h4>
              <p className="text-ink-muted">
                {viewingResponse.question1Answer}
                {viewingResponse.question1Answer === "Other" && viewingResponse.question1OtherText
                  ? ` — ${viewingResponse.question1OtherText}`
                  : ""}
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-ink">{viewingResponse.question2Text ?? QUESTIONNAIRE_PROMPTS.question2}</h4>
              <p className="text-ink-muted">
                {viewingResponse.question2Answer}
                {viewingResponse.question2Answer === "Other" && viewingResponse.question2OtherText
                  ? ` — ${viewingResponse.question2OtherText}`
                  : ""}
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-ink">{viewingResponse.question3Text ?? QUESTIONNAIRE_PROMPTS.question3}</h4>
              <p className="text-ink-muted">{viewingResponse.question3Answer}</p>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title="Delete this response?"
        description="This can't be undone. The questionnaire submission will be permanently removed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      />
    </AdminLayout>
  );
}
