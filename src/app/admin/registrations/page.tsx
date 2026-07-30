"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog } from "@/components/ui/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import type { RegistrationDocument } from "@/models/Registration";

type RegistrationRow = Omit<RegistrationDocument, "_id" | "workshopId" | "createdAt" | "updatedAt"> & {
  _id: string;
  workshopId: string;
  createdAt: string;
};

interface WorkshopOption {
  _id: string;
  title: string;
  status: string;
  featured: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_BADGE: Record<string, "primary" | "outline"> = {
  paid: "primary",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

const PAGE_SIZE = 10;

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [workshopFilter, setWorkshopFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [registrationsRes, workshopsRes] = await Promise.all([fetch("/api/registrations"), fetch("/api/workshops")]);
      const registrationsBody = await registrationsRes.json();
      const workshopsBody = await workshopsRes.json();

      if (!registrationsRes.ok || !registrationsBody.success) {
        setLoadError(registrationsBody.error?.message ?? "Failed to load registrations.");
        return;
      }
      setRegistrations(registrationsBody.data);

      if (workshopsRes.ok && workshopsBody.success) {
        setWorkshops(workshopsBody.data);
        setWorkshopFilter((prev) => {
          if (prev) return prev;
          const active = workshopsBody.data.find((w: WorkshopOption) => w.status === "published" && w.featured);
          return active ? active._id : prev;
        });
      }
    } catch {
      setLoadError("Something went wrong loading registrations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setActionError(null);
    try {
      const response = await fetch(`/api/registrations/${pendingDeleteId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to delete registration.");
        return;
      }
      setPendingDeleteId(null);
      await loadData();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return registrations.filter((registration) => {
      if (workshopFilter && registration.workshopId !== workshopFilter) return false;
      if (statusFilter && registration.status !== statusFilter) return false;
      if (paymentStatusFilter && registration.paymentStatus !== paymentStatusFilter) return false;
      if (!term) return true;
      return (
        registration.name.toLowerCase().includes(term) ||
        registration.email.toLowerCase().includes(term) ||
        registration.phone.toLowerCase().includes(term) ||
        registration.registrationNumber.toLowerCase().includes(term)
      );
    });
  }, [registrations, search, workshopFilter, statusFilter, paymentStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportHref = workshopFilter ? `/api/registrations/export?workshopId=${workshopFilter}` : "/api/registrations/export";

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/registrations" pageTitle="Registrations" headerActions={<LogoutButton />}>
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
            options={[{ value: "", label: "All Workshops" }, ...workshops.map((w) => ({ value: w._id, label: w.title }))]}
          />
          <Select
            className="sm:w-48"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Statuses" },
              ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Select
            className="sm:w-48"
            value={paymentStatusFilter}
            onChange={(event) => {
              setPaymentStatusFilter(event.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Payment Statuses" },
              ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
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
        <EmptyState title="Couldn't load registrations" description={loadError} action={<Button onClick={loadData}>Retry</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No registrations found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>WhatsApp Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Preferred Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((registration) => (
                <TableRow key={registration._id}>
                  <TableCell className="font-semibold">{registration.registrationNumber}</TableCell>
                  <TableCell>{registration.name}</TableCell>
                  <TableCell>{registration.phone}</TableCell>
                  <TableCell>{registration.email}</TableCell>
                  <TableCell>{registration.age}</TableCell>
                  <TableCell>{GENDER_LABELS[registration.gender] ?? registration.gender}</TableCell>
                  <TableCell>{registration.city}</TableCell>
                  <TableCell>{registration.preferredLanguage}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="normal-case">
                      {STATUS_LABELS[registration.status] ?? registration.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PAYMENT_STATUS_BADGE[registration.paymentStatus] ?? "outline"} className="normal-case">
                      {PAYMENT_STATUS_LABELS[registration.paymentStatus] ?? registration.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(registration.createdAt).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/registrations/${registration._id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(registration._id)}>
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
        title="Delete this registration?"
        description="This can't be undone. Registrations with an associated payment, questionnaire response, or feedback response can't be deleted."
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
