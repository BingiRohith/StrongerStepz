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
import type { DoctorDocument } from "@/models/Doctor";

type DoctorRow = Omit<DoctorDocument, "_id" | "createdAt" | "updatedAt"> & { _id: string };

const PAGE_SIZE = 10;

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  async function loadDoctors() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/doctors");
      const body = await response.json();
      if (!response.ok || !body.success) {
        setLoadError(body.error?.message ?? "Failed to load doctors.");
        return;
      }
      setDoctors([...body.data].sort((a, b) => a.displayOrder - b.displayOrder));
    } catch {
      setLoadError("Something went wrong loading doctors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return doctors;
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.qualification.toLowerCase().includes(term) ||
        d.experience.toLowerCase().includes(term)
    );
  }, [doctors, search]);

  const isFiltered = search.trim() !== "";
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleToggleActive(doctor: DoctorRow) {
    setActionError(null);
    const action = doctor.isActive ? "disable" : "enable";
    try {
      const response = await fetch(`/api/doctors/${doctor._id}/${action}`, { method: "PATCH" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to update status.");
        return;
      }
      await loadDoctors();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setActionError(null);
    try {
      const response = await fetch(`/api/doctors/${pendingDeleteId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to delete doctor.");
        return;
      }
      setPendingDeleteId(null);
      await loadDoctors();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  async function handleMove(doctor: DoctorRow, direction: -1 | 1) {
    const currentIndex = doctors.findIndex((d) => d._id === doctor._id);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= doctors.length) return;

    const reordered = [...doctors];
    const [moved] = reordered.splice(currentIndex, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    setActionError(null);
    setReorderingId(doctor._id);
    try {
      const response = await fetch("/api/doctors/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((d) => d._id) }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to reorder doctors.");
        return;
      }
      await loadDoctors();
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/doctors" pageTitle="Doctors" headerActions={<LogoutButton />}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          className="sm:max-w-xs"
          placeholder="Search by name, qualification…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Link href="/admin/doctors/new">
          <Button>+ Create Doctor</Button>
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
        <EmptyState title="Couldn't load doctors" description={loadError} action={<Button onClick={loadDoctors}>Retry</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No doctors found" description={search ? "Try a different search term." : "Create your first doctor to get started."} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((doctor) => (
                <TableRow key={doctor._id}>
                  <TableCell>
                    <ReorderControls
                      canMoveUp={!isFiltered && doctors.findIndex((d) => d._id === doctor._id) > 0}
                      canMoveDown={!isFiltered && doctors.findIndex((d) => d._id === doctor._id) < doctors.length - 1}
                      disabled={isFiltered}
                      loading={reorderingId === doctor._id}
                      onMoveUp={() => handleMove(doctor, -1)}
                      onMoveDown={() => handleMove(doctor, 1)}
                    />
                  </TableCell>
                  <TableCell>
                    {doctor.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary host
                      <img src={doctor.photoUrl} alt={doctor.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-surface-light" aria-hidden="true" />
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-ink">{doctor.name}</TableCell>
                  <TableCell>{doctor.qualification}</TableCell>
                  <TableCell>{doctor.experience}</TableCell>
                  <TableCell>
                    <Badge variant={doctor.isActive ? "primary" : "outline"} className="normal-case">
                      {doctor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/doctors/${doctor._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(doctor)}>
                        {doctor.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(doctor._id)}>
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
        title="Delete this doctor?"
        description="This can't be undone. The doctor record and photo will be permanently removed."
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
