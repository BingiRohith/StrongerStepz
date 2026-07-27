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
import type { PdfDocumentDocument } from "@/models/PdfDocument";

type PdfDocumentRow = Omit<PdfDocumentDocument, "_id" | "createdAt" | "updatedAt"> & { _id: string };

const PAGE_SIZE = 10;

function fileNameFromPublicId(publicId: string): string {
  return publicId.split("/").pop() ?? publicId;
}

export default function AdminPdfsPage() {
  const [pdfs, setPdfs] = useState<PdfDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadPdfs() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/pdfs");
      const body = await response.json();
      if (!response.ok || !body.success) {
        setLoadError(body.error?.message ?? "Failed to load PDFs.");
        return;
      }
      setPdfs(body.data);
    } catch {
      setLoadError("Something went wrong loading PDFs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPdfs();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pdfs;
    return pdfs.filter((pdf) => pdf.title.toLowerCase().includes(term));
  }, [pdfs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleToggleActive(pdf: PdfDocumentRow) {
    setActionError(null);
    const action = pdf.isActive ? "disable" : "enable";
    try {
      const response = await fetch(`/api/pdfs/${pdf._id}/${action}`, { method: "PATCH" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to update status.");
        return;
      }
      await loadPdfs();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setActionError(null);
    try {
      const response = await fetch(`/api/pdfs/${pendingDeleteId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to delete PDF.");
        return;
      }
      setPendingDeleteId(null);
      await loadPdfs();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/pdfs" pageTitle="PDF Management" headerActions={<LogoutButton />}>
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
        <Link href="/admin/pdfs/new">
          <Button>+ Upload PDF</Button>
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
        <EmptyState title="Couldn't load PDFs" description={loadError} action={<Button onClick={loadPdfs}>Retry</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No PDFs found" description={search ? "Try a different search term." : "Upload your first PDF to get started."} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((pdf) => (
                <TableRow key={pdf._id}>
                  <TableCell className="font-semibold text-ink">{pdf.title}</TableCell>
                  <TableCell>
                    <a href={pdf.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {fileNameFromPublicId(pdf.filePublicId)}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pdf.isActive ? "primary" : "outline"} className="normal-case">
                      {pdf.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/pdfs/${pdf._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(pdf)}>
                        {pdf.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(pdf._id)}>
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
        title="Delete this PDF?"
        description="This can't be undone. The file will be permanently removed from Cloudinary."
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
