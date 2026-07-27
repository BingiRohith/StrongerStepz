"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/ui/SearchBar";
import { Pagination } from "@/components/ui/Pagination";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import type { FeedbackFormDocument } from "@/models/FeedbackForm";

type FeedbackFormRow = Omit<FeedbackFormDocument, "_id" | "createdAt" | "updatedAt"> & { _id: string };

const PAGE_SIZE = 10;

export default function AdminFeedbackFormsPage() {
  const [forms, setForms] = useState<FeedbackFormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadForms() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/feedback-forms");
      const body = await response.json();
      if (!response.ok || !body.success) {
        setLoadError(body.error?.message ?? "Failed to load feedback forms.");
        return;
      }
      setForms(body.data);
    } catch {
      setLoadError("Something went wrong loading feedback forms.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForms();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return forms;
    return forms.filter((f) => f.title.toLowerCase().includes(term));
  }, [forms, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleToggleActive(form: FeedbackFormRow) {
    setActionError(null);
    const action = form.isActive ? "disable" : "enable";
    try {
      const response = await fetch(`/api/feedback-forms/${form._id}/${action}`, { method: "PATCH" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to update status.");
        return;
      }
      await loadForms();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setActionError(null);
    try {
      const response = await fetch(`/api/feedback-forms/${pendingDeleteId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to delete feedback form.");
        return;
      }
      setPendingDeleteId(null);
      await loadForms();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/feedback-forms" pageTitle="Feedback Forms" headerActions={<LogoutButton />}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          className="sm:max-w-xs"
          placeholder="Search by title…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Link href="/admin/feedback-forms/new">
          <Button>+ Create Feedback Form</Button>
        </Link>
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
        <EmptyState title="Couldn't load feedback forms" description={loadError} action={<Button onClick={loadForms}>Retry</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No feedback forms found"
          description={search ? "Try a different search term." : "Create your first feedback form to get started."}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((form) => (
                <TableRow key={form._id}>
                  <TableCell>
                    <div className="font-semibold text-ink">{form.title}</div>
                    {form.description && <div className="text-xs text-ink-muted">{form.description}</div>}
                  </TableCell>
                  <TableCell>{form.fields.length}</TableCell>
                  <TableCell>
                    <Badge variant={form.isActive ? "primary" : "outline"} className="normal-case">
                      {form.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/feedback-forms/${form._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(form)}>
                        {form.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(form._id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <Dialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title="Delete this feedback form?"
        description="This can't be undone. Existing responses to this form stay in the database, but the form definition itself is permanently removed."
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
