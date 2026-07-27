"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { ReorderControls } from "@/components/admin/ReorderControls";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/ui/SearchBar";
import { Pagination } from "@/components/ui/Pagination";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import type { TestimonialDocument } from "@/models/Testimonial";

type TestimonialRow = Omit<TestimonialDocument, "_id" | "createdAt" | "updatedAt"> & { _id: string };

const PAGE_SIZE = 10;

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  async function loadTestimonials() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/testimonials");
      const body = await response.json();
      if (!response.ok || !body.success) {
        setLoadError(body.error?.message ?? "Failed to load testimonials.");
        return;
      }
      setTestimonials([...body.data].sort((a, b) => a.displayOrder - b.displayOrder));
    } catch {
      setLoadError("Something went wrong loading testimonials.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTestimonials();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return testimonials;
    return testimonials.filter((t) => t.name.toLowerCase().includes(term) || t.message.toLowerCase().includes(term));
  }, [testimonials, search]);

  const isFiltered = search.trim() !== "";
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleToggleActive(testimonial: TestimonialRow) {
    setActionError(null);
    const action = testimonial.isActive ? "disable" : "enable";
    try {
      const response = await fetch(`/api/testimonials/${testimonial._id}/${action}`, { method: "PATCH" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to update status.");
        return;
      }
      await loadTestimonials();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setActionError(null);
    try {
      const response = await fetch(`/api/testimonials/${pendingDeleteId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to delete testimonial.");
        return;
      }
      setPendingDeleteId(null);
      await loadTestimonials();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  async function handleMove(testimonial: TestimonialRow, direction: -1 | 1) {
    const currentIndex = testimonials.findIndex((t) => t._id === testimonial._id);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;

    const reordered = [...testimonials];
    const [moved] = reordered.splice(currentIndex, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    setActionError(null);
    setReorderingId(testimonial._id);
    try {
      const response = await fetch("/api/testimonials/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((t) => t._id) }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to reorder testimonials.");
        return;
      }
      await loadTestimonials();
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/testimonials" pageTitle="Testimonials" headerActions={<LogoutButton />}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          className="sm:max-w-xs"
          placeholder="Search by name or message…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Link href="/admin/testimonials/new">
          <Button>+ Create Testimonial</Button>
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
        <EmptyState title="Couldn't load testimonials" description={loadError} action={<Button onClick={loadTestimonials}>Retry</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No testimonials found"
          description={search ? "Try a different search term." : "Create your first testimonial to get started."}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((testimonial) => (
                <TableRow key={testimonial._id}>
                  <TableCell>
                    <ReorderControls
                      canMoveUp={!isFiltered && testimonials.findIndex((t) => t._id === testimonial._id) > 0}
                      canMoveDown={!isFiltered && testimonials.findIndex((t) => t._id === testimonial._id) < testimonials.length - 1}
                      disabled={isFiltered}
                      loading={reorderingId === testimonial._id}
                      onMoveUp={() => handleMove(testimonial, -1)}
                      onMoveDown={() => handleMove(testimonial, 1)}
                    />
                  </TableCell>
                  <TableCell>
                    {testimonial.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary host
                      <img src={testimonial.photoUrl} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-surface-light" aria-hidden="true" />
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-ink">{testimonial.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-ink-muted">{testimonial.message}</TableCell>
                  <TableCell>
                    <Badge variant={testimonial.isActive ? "primary" : "outline"} className="normal-case">
                      {testimonial.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/testimonials/${testimonial._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(testimonial)}>
                        {testimonial.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(testimonial._id)}>
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
        title="Delete this testimonial?"
        description="This can't be undone. The testimonial and its photo will be permanently removed."
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
