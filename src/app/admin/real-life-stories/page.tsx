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
import type { RealLifeStoryDocument } from "@/models/RealLifeStory";

type RealLifeStoryRow = Omit<RealLifeStoryDocument, "_id" | "createdAt" | "updatedAt"> & { _id: string };

const PAGE_SIZE = 10;

export default function AdminRealLifeStoriesPage() {
  const [stories, setStories] = useState<RealLifeStoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  async function loadStories() {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/real-life-stories");
      const body = await response.json();
      if (!response.ok || !body.success) {
        setLoadError(body.error?.message ?? "Failed to load real life stories.");
        return;
      }
      setStories([...body.data].sort((a, b) => a.displayOrder - b.displayOrder));
    } catch {
      setLoadError("Something went wrong loading real life stories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStories();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stories;
    return stories.filter((s) => s.name.toLowerCase().includes(term) || s.title.toLowerCase().includes(term));
  }, [stories, search]);

  const isFiltered = search.trim() !== "";
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleToggleActive(story: RealLifeStoryRow) {
    setActionError(null);
    const action = story.isActive ? "disable" : "enable";
    try {
      const response = await fetch(`/api/real-life-stories/${story._id}/${action}`, { method: "PATCH" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to update status.");
        return;
      }
      await loadStories();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setActionError(null);
    try {
      const response = await fetch(`/api/real-life-stories/${pendingDeleteId}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to delete story.");
        return;
      }
      setPendingDeleteId(null);
      await loadStories();
    } catch {
      setActionError("Something went wrong. Please try again.");
    }
  }

  async function handleMove(story: RealLifeStoryRow, direction: -1 | 1) {
    const currentIndex = stories.findIndex((s) => s._id === story._id);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= stories.length) return;

    const reordered = [...stories];
    const [moved] = reordered.splice(currentIndex, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    setActionError(null);
    setReorderingId(story._id);
    try {
      const response = await fetch("/api/real-life-stories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((s) => s._id) }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setActionError(body.error?.message ?? "Failed to reorder stories.");
        return;
      }
      await loadStories();
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV_ITEMS} activeHref="/admin/real-life-stories" pageTitle="Real Life Stories" headerActions={<LogoutButton />}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          className="sm:max-w-xs"
          placeholder="Search by name or title…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Link href="/admin/real-life-stories/new">
          <Button>+ Create Story</Button>
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
        <EmptyState title="Couldn't load real life stories" description={loadError} action={<Button onClick={loadStories}>Retry</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No real life stories found"
          description={search ? "Try a different search term." : "Create your first story to get started."}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Before / After</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((story) => (
                <TableRow key={story._id}>
                  <TableCell>
                    <ReorderControls
                      canMoveUp={!isFiltered && stories.findIndex((s) => s._id === story._id) > 0}
                      canMoveDown={!isFiltered && stories.findIndex((s) => s._id === story._id) < stories.length - 1}
                      disabled={isFiltered}
                      loading={reorderingId === story._id}
                      onMoveUp={() => handleMove(story, -1)}
                      onMoveDown={() => handleMove(story, 1)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {story.beforeImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary host
                        <img src={story.beforeImageUrl} alt={`${story.name} before`} className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-surface-light" aria-hidden="true" />
                      )}
                      {story.afterImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary host
                        <img src={story.afterImageUrl} alt={`${story.name} after`} className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-surface-light" aria-hidden="true" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-ink">{story.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-ink-muted">{story.title}</TableCell>
                  <TableCell>
                    <Badge variant={story.isActive ? "primary" : "outline"} className="normal-case">
                      {story.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/real-life-stories/${story._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(story)}>
                        {story.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(story._id)}>
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
        title="Delete this story?"
        description="This can't be undone. The story and its images will be permanently removed."
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
