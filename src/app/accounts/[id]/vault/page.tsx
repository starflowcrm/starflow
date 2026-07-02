"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, FolderPlus, FolderTree, Folder, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthData, clearAuth } from "@/lib/api";

interface VaultItem {
  id: number;
  name: string;
  media_type: "photo" | "video";
  file_id: string;
  default_star_price: number;
  created_at: string;
  folder_id?: number | null;
}

interface VaultFolder {
  id: number;
  name: string;
  parent_id?: number | null;
  sort_order?: number;
  created_at?: string | null;
}

type DropPosition = "before" | "inside" | "after";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authFetch(path: string, opts: RequestInit = {}) {
  const token = getAuthData()?.token;
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
}

function sortFolders(folders: VaultFolder[]) {
  return [...folders].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
}

function buildFolderOptions(folders: VaultFolder[], parentId: number | null = null, depth = 0): { id: number; label: string }[] {
  return sortFolders(folders)
    .filter((folder) => (folder.parent_id ?? null) === parentId)
    .flatMap((folder) => [
      { id: folder.id, label: `${"— ".repeat(depth)}${folder.name}` },
      ...buildFolderOptions(folders, folder.id, depth + 1),
    ]);
}

function isDescendant(folders: VaultFolder[], folderId: number, possibleAncestorId: number) {
  let current = folders.find((folder) => folder.id === folderId);
  while (current?.parent_id != null) {
    if (current.parent_id === possibleAncestorId) return true;
    current = folders.find((folder) => folder.id === current?.parent_id);
  }
  return false;
}

function computeDropPosition(ratio: number): DropPosition {
  if (ratio < 1 / 3) return "before";
  if (ratio > 2 / 3) return "after";
  return "inside";
}

type DropTarget =
  | { kind: "folder"; folderId: number; position: DropPosition }
  | { kind: "root" };

function layoutKey(folders: VaultFolder[]): string {
  return folders
    .map((f) => `${f.id}:${f.parent_id ?? ""}:${f.sort_order ?? 0}`)
    .sort()
    .join("|");
}

function applyFolderMove(
  folders: VaultFolder[],
  draggedId: number,
  target: DropTarget,
): VaultFolder[] | null {
  const next = folders.map((folder) => ({ ...folder }));
  const dragged = next.find((folder) => folder.id === draggedId);
  if (!dragged) return null;

  let newParentId: number | null;
  let anchor: { id: number; position: "before" | "after" } | null = null;

  if (target.kind === "root") {
    newParentId = null;
  } else {
    const targetFolder = next.find((folder) => folder.id === target.folderId);
    if (!targetFolder || targetFolder.id === dragged.id) return null;
    if (target.position === "inside") {
      newParentId = targetFolder.id;
    } else {
      newParentId = targetFolder.parent_id ?? null;
      anchor = { id: targetFolder.id, position: target.position };
    }
  }

  if (newParentId === dragged.id) return null;
  if (newParentId != null && isDescendant(next, newParentId, dragged.id)) return null;

  const oldParentId = dragged.parent_id ?? null;
  dragged.parent_id = newParentId;

  const destSiblings = sortFolders(next).filter(
    (folder) => (folder.parent_id ?? null) === newParentId && folder.id !== dragged.id
  );
  let insertAt = destSiblings.length;
  if (anchor) {
    const anchorIndex = destSiblings.findIndex((folder) => folder.id === anchor!.id);
    if (anchorIndex !== -1) insertAt = anchor.position === "before" ? anchorIndex : anchorIndex + 1;
  }
  destSiblings.splice(insertAt, 0, dragged);
  destSiblings.forEach((folder, index) => {
    folder.sort_order = index;
  });

  if (oldParentId !== newParentId) {
    sortFolders(next)
      .filter((folder) => (folder.parent_id ?? null) === oldParentId)
      .forEach((folder, index) => {
        folder.sort_order = index;
      });
  }

  return next;
}

function FolderRow({
  folder,
  depth,
  activeFolderId,
  draggingFolderId,
  dropPreview,
  onSelect,
  onDelete,
  onMove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  folder: VaultFolder;
  depth: number;
  activeFolderId: number | null;
  draggingFolderId: number | null;
  dropPreview: { folderId: number | null; position: DropPosition | null };
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onMove: (id: number, direction: "up" | "down") => void;
  onDragStart: (folderId: number, e: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragOver: (folderId: number, e: React.DragEvent<HTMLElement>, rowEl: HTMLElement | null) => void;
  onDrop: (folderId: number, e: React.DragEvent<HTMLElement>, rowEl: HTMLElement | null) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDragging = draggingFolderId === folder.id;
  const isSubfolder = depth > 0;
  const isPreviewBefore = dropPreview.folderId === folder.id && dropPreview.position === "before";
  const isPreviewInside = dropPreview.folderId === folder.id && dropPreview.position === "inside";
  const isPreviewAfter = dropPreview.folderId === folder.id && dropPreview.position === "after";

  return (
    // The wrapper also catches drags so drops in the gaps between rows land;
    // geometry is always measured against the row itself (rowRef), and the
    // indicators are absolutely positioned overlays — nothing shifts layout
    // mid-drag, which is what made drops miss before.
    <div
      onDragOver={(e) => onDragOver(folder.id, e, rowRef.current)}
      onDrop={(e) => onDrop(folder.id, e, rowRef.current)}
      className={isSubfolder ? "ml-4 border-l border-white/10 pl-3" : ""}
    >
      <div
        ref={rowRef}
        className={`group relative flex w-full items-center gap-2 rounded-md px-3 py-3 text-left text-sm ${
          activeFolderId === folder.id ? "bg-violet-600/30 text-white" : "text-gray-300 hover:bg-white/5"
        } ${isDragging ? "opacity-50" : "opacity-100"} ${isSubfolder ? "bg-white/[0.03]" : ""} ${isPreviewInside ? "bg-blue-500/15 ring-1 ring-blue-400/70 shadow-[0_0_20px_rgba(96,165,250,0.18)]" : ""}`}
      >
        {isPreviewBefore && (
          <div className="pointer-events-none absolute -top-[5px] left-0 right-0 h-[3px] rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.7)]" />
        )}
        {isPreviewAfter && (
          <div className="pointer-events-none absolute -bottom-[5px] left-0 right-0 h-[3px] rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.7)]" />
        )}
        <button
          type="button"
          draggable
          onDragStart={(e) => onDragStart(folder.id, e)}
          onDragEnd={onDragEnd}
          onClick={(e) => e.preventDefault()}
          className="cursor-grab active:cursor-grabbing"
          aria-label={`Drag to reorder ${folder.name}`}
        >
          <GripVertical className="h-4 w-4 shrink-0 text-gray-500" />
        </button>
        <button type="button" onClick={() => onSelect(folder.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <Folder className={`h-4 w-4 shrink-0 ${isSubfolder ? "text-violet-300" : ""}`} />
          <span className="truncate">{folder.name}</span>
          {isSubfolder ? <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-violet-200">subfolder</span> : null}
        </button>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          <button type="button" onClick={() => onMove(folder.id, "up")} className="text-gray-400 hover:text-white" aria-label={`Move ${folder.name} up`}>
            ↑
          </button>
          <button type="button" onClick={() => onMove(folder.id, "down")} className="text-gray-400 hover:text-white" aria-label={`Move ${folder.name} down`}>
            ↓
          </button>
          <button type="button" onClick={() => onDelete(folder.id)} className="text-red-400 opacity-70 hover:text-red-300 group-hover:opacity-100">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FolderTreeView({
  folders,
  parentId,
  depth,
  activeFolderId,
  draggingFolderId,
  dropPreview,
  onSelect,
  onDelete,
  onMove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  folders: VaultFolder[];
  parentId: number | null;
  depth: number;
  activeFolderId: number | null;
  draggingFolderId: number | null;
  dropPreview: { folderId: number | null; position: DropPosition | null };
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onMove: (id: number, direction: "up" | "down") => void;
  onDragStart: (folderId: number, e: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragOver: (folderId: number, e: React.DragEvent<HTMLElement>, rowEl: HTMLElement | null) => void;
  onDrop: (folderId: number, e: React.DragEvent<HTMLElement>, rowEl: HTMLElement | null) => void;
}) {
  const children = sortFolders(folders).filter((folder) => (folder.parent_id ?? null) === parentId);
  if (!children.length) return null;

  return (
    <div className="space-y-2">
      {children.map((folder) => (
        <div key={folder.id}>
          <FolderRow
            folder={folder}
            depth={depth}
            activeFolderId={activeFolderId}
            draggingFolderId={draggingFolderId}
            dropPreview={dropPreview}
            onSelect={onSelect}
            onDelete={onDelete}
            onMove={onMove}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
          />
          <FolderTreeView
            folders={folders}
            parentId={folder.id}
            depth={depth + 1}
            activeFolderId={activeFolderId}
            draggingFolderId={draggingFolderId}
            dropPreview={dropPreview}
            onSelect={onSelect}
            onDelete={onDelete}
            onMove={onMove}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
          />
        </div>
      ))}
    </div>
  );
}

export default function AccountVaultPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = Number(params.id);
  const { theme, setTheme } = useTheme();
  const dragFrame = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("100");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string>("");
  const [activeFolderFilter, setActiveFolderFilter] = useState<number | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<number | null>(null);
  const [dropPreview, setDropPreview] = useState<{ folderId: number | null; position: DropPosition | null }>({ folderId: null, position: null });
  const [rootDropActive, setRootDropActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!getAuthData()?.token) router.replace("/login");
  }, [router]);


  async function loadVault() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("account_id", String(accountId));
      if (activeFolderFilter) params.set("folder_id", String(activeFolderFilter));
      const res = await authFetch(`/vault/?${params.toString()}`);
      if (res.status === 401) {
        clearAuth();
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data.items || []);
      setFolders(data.folders || []);
    } catch {
      setError("Failed to load vault");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mounted && accountId) loadVault();
  }, [mounted, accountId, activeFolderFilter]);

  const folderOptions = useMemo(() => buildFolderOptions(folders), [folders]);

  async function persistFolderLayout(nextFolders: VaultFolder[]): Promise<VaultFolder[]> {
    const res = await authFetch("/vault/folders/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folders: nextFolders.map((f) => ({
          id: f.id,
          parent_id: f.parent_id ?? null,
          sort_order: f.sort_order ?? 0,
        })),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || "Failed to save folder order");
    }
    const data = await res.json();
    return (data.folders || []) as VaultFolder[];
  }

  async function commitFolderMove(draggedId: number, target: DropTarget) {
    const moved = applyFolderMove(folders, draggedId, target);
    if (!moved || layoutKey(moved) === layoutKey(folders)) return;

    const previousFolders = folders;
    setFolders(moved);
    setError("");
    try {
      const canonical = await persistFolderLayout(moved);
      setFolders(canonical);
    } catch (err) {
      setFolders(previousFolders);
      setError(err instanceof Error ? err.message : "Failed to save folder order");
    }
  }

  function handleDragStart(folderId: number, e: React.DragEvent<HTMLElement>) {
    setDraggingFolderId(folderId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(folderId));
  }

  function handleDragEnd() {
    setDraggingFolderId(null);
    setDropPreview({ folderId: null, position: null });
    setRootDropActive(false);
    if (dragFrame.current) {
      cancelAnimationFrame(dragFrame.current);
      dragFrame.current = null;
    }
  }

  function handleDragOver(folderId: number, e: React.DragEvent<HTMLElement>, rowEl: HTMLElement | null) {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = Number(e.dataTransfer.getData("text/plain") || draggingFolderId);
    if (!draggedId || draggedId === folderId) return;

    const rect = (rowEl ?? e.currentTarget).getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const position = computeDropPosition(ratio);

    if (dragFrame.current) cancelAnimationFrame(dragFrame.current);
    dragFrame.current = requestAnimationFrame(() => {
      setDropPreview((prev) => {
        if (prev.folderId === folderId && prev.position === position) return prev;
        return { folderId: folderId, position };
      });
    });
  }

  async function handleDrop(targetFolderId: number, e: React.DragEvent<HTMLElement>, rowEl: HTMLElement | null) {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = Number(e.dataTransfer.getData("text/plain") || draggingFolderId);
    const rect = (rowEl ?? e.currentTarget).getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const position: DropPosition = computeDropPosition(ratio);
    handleDragEnd();

    if (!draggedId || draggedId === targetFolderId) return;
    await commitFolderMove(draggedId, { kind: "folder", folderId: targetFolderId, position });
  }

  function handleRootDragOver(e: React.DragEvent<HTMLElement>) {
    if (draggingFolderId == null) return;
    e.preventDefault();
    e.stopPropagation();
    setRootDropActive(true);
  }

  async function handleRootDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = Number(e.dataTransfer.getData("text/plain") || draggingFolderId);
    handleDragEnd();
    if (!draggedId) return;
    await commitFolderMove(draggedId, { kind: "root" });
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    const mediaType = file.type.startsWith("video") ? "video" : "photo";
    const form = new FormData();
    form.append("file", file);
    form.append("name", name || file.name);
    form.append("default_star_price", price || "100");
    form.append("media_type", mediaType);
    form.append("account_id", String(accountId));
    if (selectedFolderId) form.append("folder_id", selectedFolderId);

    try {
      const res = await authFetch("/vault/", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setName("");
      setPrice("100");
      setSelectedFolderId("");
      if (fileRef.current) fileRef.current.value = "";
      await loadVault();
    } catch {
      setError("Upload failed");
    }
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const form = new FormData();
    form.append("name", newFolderName.trim());
    form.append("account_id", String(accountId));
    if (newFolderParentId) form.append("parent_id", newFolderParentId);

    try {
      const res = await authFetch("/vault/folders", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setNewFolderName("");
      setNewFolderParentId("");
      await loadVault();
    } catch {
      setError("Failed to create folder");
    }
  }

  async function handleMoveFolder(folderId: number, direction: "up" | "down") {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    const siblings = sortFolders(folders).filter(
      (f) => (f.parent_id ?? null) === (folder.parent_id ?? null)
    );
    const currentIndex = siblings.findIndex((f) => f.id === folderId);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex === -1 || swapIndex < 0 || swapIndex >= siblings.length) return;

    await commitFolderMove(folderId, {
      kind: "folder",
      folderId: siblings[swapIndex].id,
      position: direction === "up" ? "before" : "after",
    });
  }

  async function handleDeleteFolder(folderId: number) {
    if (!confirm("Delete this folder? Items inside it will be moved to No folder.")) return;
    try {
      const res = await authFetch(`/vault/folders/${folderId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to delete folder");
      }
      if (activeFolderFilter === folderId) setActiveFolderFilter(null);
      await loadVault();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete folder");
    }
  }

  async function moveItem(itemId: number, folderId: string) {
    const form = new FormData();
    if (folderId) form.append("folder_id", folderId);
    try {
      const res = await authFetch(`/vault/${itemId}/move`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      await loadVault();
    } catch {
      setError("Failed to move item");
    }
  }

  async function deleteItem(id: number) {
    if (!confirm("Delete this item?")) return;
    try {
      const res = await authFetch(`/vault/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await loadVault();
    } catch {
      setError("Failed to delete item");
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e1b4b,_#09090f_55%)] text-white">
      <div className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/accounts/${accountId}`} className="text-sm text-gray-300 hover:text-white">← Account Dashboard</Link>
            <h1 className="text-xl font-semibold">Content Vault</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark") }>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-200">
              <FolderTree className="h-4 w-4" />
              Folders
            </div>
            <button
              type="button"
              onClick={() => setActiveFolderFilter(null)}
              onDragOver={handleRootDragOver}
              onDragLeave={() => setRootDropActive(false)}
              onDrop={handleRootDrop}
              className={`mb-2 w-full rounded-md px-3 py-2 text-left text-sm transition-all ${
                activeFolderFilter === null ? "bg-violet-600/30" : "text-gray-300 hover:bg-white/5"
              } ${rootDropActive ? "bg-blue-500/15 ring-1 ring-blue-400/70" : ""}`}
            >
              All items
              {draggingFolderId != null && (
                <span className="ml-2 text-[10px] uppercase tracking-wide text-blue-300">drop here for top level</span>
              )}
            </button>
            <FolderTreeView
              folders={folders}
              parentId={null}
              depth={0}
              activeFolderId={activeFolderFilter}
              draggingFolderId={draggingFolderId}
              dropPreview={dropPreview}
              onSelect={setActiveFolderFilter}
              onDelete={handleDeleteFolder}
              onMove={handleMoveFolder}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
            <p className="mt-3 text-xs text-gray-500">Drag folders to reorder or nest them. Drop a folder on &ldquo;All items&rdquo; to move it back to the top level.</p>
          </div>

          <form onSubmit={handleCreateFolder} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
              <FolderPlus className="h-4 w-4" />
              Add Folder
            </div>
            <div>
              <Label>Folder name</Label>
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. PPV / Holidays" />
            </div>
            <div>
              <Label>Parent folder</Label>
              <select
                value={newFolderParentId}
                onChange={(e) => setNewFolderParentId(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/10 bg-[#221f43] px-3 py-2 text-sm"
              >
                <option value="">Top level</option>
                {folderOptions.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full">Create Folder</Button>
          </form>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleUpload} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-2 text-lg font-semibold">Upload to Vault</h2>
            <p className="mb-4 text-sm text-gray-400">Files are uploaded via Telethon. Organize them into folders as you go.</p>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <Label>File (photo or video)</Label>
                <Input ref={fileRef} type="file" accept="image/*,video/*" className="mt-2" />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pool video" className="mt-2" />
              </div>
              <div>
                <Label>Default star price</Label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="mt-2" />
              </div>
            </div>
            <div className="mt-4 max-w-sm">
              <Label>Folder</Label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/10 bg-[#221f43] px-3 py-2 text-sm"
              >
                <option value="">No folder</option>
                {folderOptions.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="mt-4">Upload to Vault</Button>
          </form>

          {error ? <div className="text-sm text-red-400">{error}</div> : null}

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Vault Items</h2>
              {loading ? <span className="text-sm text-gray-400">Loading...</span> : <span className="text-sm text-gray-400">{items.length} item(s)</span>}
            </div>

            {!loading && items.length === 0 ? (
              <div className="py-16 text-center text-gray-400">Vault is empty, upload your first item above.</div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/10 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-400">{item.media_type} • {item.default_star_price} stars</div>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <select
                        value={item.folder_id ?? ""}
                        onChange={(e) => moveItem(item.id, e.target.value)}
                        className="rounded-md border border-white/10 bg-[#221f43] px-3 py-2 text-sm"
                      >
                        <option value="">No folder</option>
                        {folderOptions.map((folder) => (
                          <option key={folder.id} value={folder.id}>{folder.label}</option>
                        ))}
                      </select>
                      <Button variant="destructive" onClick={() => deleteItem(item.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
