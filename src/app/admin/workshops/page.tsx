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
import type { WorkshopDocument } from "@/models/Workshop";

type WorkshopRow = Omit<WorkshopDocument, "_id" | "date" | "createdAt" | "updatedAt"> & {
  _id: string;
  date: string;
};

const PAGE_SIZE = 10;

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadWorkshops() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/workshops");
      const body = await response.json();
      if (!response.ok || !body.success) {
        setLoadError(body.error?.message ?? "Failed to load workshops.");
        return;
      }
      setWorkshops(body.data);
    } catch {
      setLoadError("Something went wrong loading workshops.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkshops();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return workshops;
    return workshops.filter((w) => w.title.toLowerCase().includes(term) || w.slug.toLowerCase().includes(term));
  }, [workshops, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleToggleStatus(workshop: WorkshopRow) {
    setActionError(null);
    const action = workshop.status === "published" ? "disable" : "enable";
    try {
      const response = await fetch(`/api/workshops/${workshop._id}/${action}`, { method: "PATCH" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to update workshop status.");
        return;
      }
      await loadWorkshops();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setActionError(null);
    try {
      const response = await fetch(`/api/workshops/${pendingDeleteId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to delete workshop.");
        return;
      }
      setPendingDeleteId(null);
      await loadWorkshops();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/workshops" pageTitle="Workshops" headerActions={<LogoutButton />}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          className="sm:max-w-xs"
          placeholder="Search by title or slug…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Link href="/admin/workshops/new">
          <Button>+ Create Workshop</Button>
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
        <EmptyState title="Couldn't load workshops" description={loadError} action={<Button onClick={loadWorkshops}>Retry</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No workshops found"
          description={search ? "Try a different search term." : "Create your first workshop to get started."}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((workshop) => (
                <TableRow key={workshop._id}>
                  <TableCell>
                    <div className="font-semibold text-ink">{workshop.title}</div>
                    <div className="text-xs text-ink-muted">{workshop.slug}</div>
                  </TableCell>
                  <TableCell>{new Date(workshop.date).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>₹{workshop.price}</TableCell>
                  <TableCell>
                    <Badge variant={workshop.status === "published" ? "primary" : "outline"} className="normal-case">
                      {workshop.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{workshop.featured ? "Yes" : "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/workshops/${workshop._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(workshop)}>
                        {workshop.status === "published" ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(workshop._id)}>
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
        title="Delete this workshop?"
        description="This can't be undone. Existing registrations for this workshop stay in the database, but the workshop record itself is permanently removed."
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
