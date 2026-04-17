"use client";

import { FileText, ImageIcon, Loader2, MoreVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { DOCUMENT_CATEGORIES } from "./documentCategories";
import type { DocumentListItem } from "./DocumentsPageClient";

const storageBucket = "property-docs";

function formatRowDate(dateMs: number) {
  if (!dateMs) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateMs));
}

function FileTypeIcon({ doc }: { doc: DocumentListItem }) {
  if (doc.isPhoto) {
    return <ImageIcon className="size-5 shrink-0 text-slate-500" aria-hidden />;
  }
  return <FileText className="size-5 shrink-0 text-slate-500" aria-hidden />;
}

type ArchiveDocumentRowProps = {
  doc: DocumentListItem;
  onPatched: (id: string | number, patch: Partial<DocumentListItem>) => void;
  onRemoved: (id: string | number) => void;
};

export default function ArchiveDocumentRow({ doc, onPatched, onRemoved }: ArchiveDocumentRowProps) {
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const rowId = String(doc.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [recatOpen, setRecatOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(doc.title);
  const [recatValue, setRecatValue] = useState(doc.category);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renameOpen || recatOpen) return;
    setRenameValue(doc.title);
    setRecatValue(doc.category);
  }, [doc.id, doc.title, doc.category, renameOpen, recatOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const applyRename = async () => {
    const next = renameValue.trim();
    if (!next || !supabase || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("documents").update({ title: next }).eq("id", rowId);
      if (error) throw error;
      onPatched(doc.id, { title: next });
      setRenameOpen(false);
      setMenuOpen(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Rename failed");
    } finally {
      setBusy(false);
    }
  };

  const applyRecategorize = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("documents").update({ category: recatValue }).eq("id", rowId);
      if (error) throw error;
      onPatched(doc.id, { category: recatValue });
      setRecatOpen(false);
      setMenuOpen(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Recategorize failed");
    } finally {
      setBusy(false);
    }
  };

  const applyDelete = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    try {
      const { error: delErr } = await supabase.from("documents").delete().eq("id", rowId);
      if (delErr) throw delErr;
      if (doc.storagePath) {
        await supabase.storage.from(storageBucket).remove([doc.storagePath]);
      }
      onRemoved(doc.id);
      setDeleteOpen(false);
      setMenuOpen(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <li className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-white px-4 py-3 transition-colors hover:bg-slate-50">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <FileTypeIcon doc={doc} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{doc.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">Uploaded {formatRowDate(doc.dateMs)}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {doc.downloadUrl ? (
            <a
              href={doc.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg border border-indigo-600 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
            >
              Download
            </a>
          ) : (
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-400">
              Download
            </span>
          )}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="More actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-200/80 hover:text-slate-900"
            >
              <MoreVertical className="size-5" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => {
                    setRenameValue(doc.title);
                    setRenameOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => {
                    setRecatValue(doc.category);
                    setRecatOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  Recategorize
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setDeleteOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </li>

      {renameOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          onClick={() => setRenameOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-slate-900">Rename document</p>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                onClick={() => void applyRename()}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {recatOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          onClick={() => setRecatOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-slate-900">Recategorize</p>
            <select
              value={recatValue}
              onChange={(e) => setRecatValue(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {DOCUMENT_CATEGORIES.every((c) => c !== doc.category) ? (
                <option value={doc.category}>{doc.category}</option>
              ) : null}
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setRecatOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                onClick={() => void applyRecategorize()}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          onClick={() => setDeleteOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-slate-900">Delete document?</p>
            <p className="mt-2 text-sm text-slate-600">
              This removes the library entry
              {doc.storagePath ? " and attempts to delete the file from storage" : ""}. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                onClick={() => void applyDelete()}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
