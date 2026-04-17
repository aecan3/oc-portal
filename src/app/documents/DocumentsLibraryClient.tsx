"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import DocumentsPageClient, { type DocumentListItem } from "./DocumentsPageClient";

const storageBucket = "property-docs";

const toTimestamp = (value: unknown): number => {
  const date = new Date(String(value ?? ""));
  const ms = date.getTime();
  return Number.isFinite(ms) ? ms : 0;
};

export default function DocumentsLibraryClient() {
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState<string | number | null>(null);
  const [resolvedDocs, setResolvedDocs] = useState<DocumentListItem[]>([]);
  const [section151ModalOpen, setSection151ModalOpen] = useState(false);

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const client: SupabaseClient = supabase;

    let cancelled = false;

    async function fetchDocuments() {
      const { data: propRows, error: propError } = await client
        .from("properties")
        .select("id")
        .order("id", { ascending: true })
        .limit(1);

      if (propError) {
        console.log("Supabase properties (for property_id FK) error:", propError);
      }

      const resolvedPropertyId = propRows?.[0]?.id ?? null;
      if (!cancelled) {
        setPropertyId(resolvedPropertyId);
      }
      console.log("property_id for uploads (from properties table):", resolvedPropertyId);

      const { data: docsData, error: docsError } = await client
        .from("documents")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (docsError) {
        console.log("Supabase documents query error:", docsError);
      }

      const raw = Array.isArray(docsData) ? docsData : [];

      const byId = new Map<string, DocumentListItem>();
      for (const d of raw as any[]) {
        const rowId =
          d?.id != null && d?.id !== ""
            ? String(d.id)
            : `no-id-${d?.storage_path ?? d?.title ?? Math.random()}`;
        if (byId.has(rowId)) {
          continue;
        }

        const title = d.title ?? d.document_title ?? d.name ?? "Untitled Document";
        const rawCategory = d.category ?? d.document_category ?? d.doc_category;
        const category = String(rawCategory ?? "").trim() || "Other";

        const uploadedAt =
          d.uploaded_at ?? d.date_uploaded ?? d.created_at ?? d.inserted_at ?? d.updated_at ?? null;

        const dateMs = toTimestamp(uploadedAt);

        const storagePath = d.storage_path ?? d.path ?? d.file_path ?? null;
        const bucket = d.bucket ?? d.storage_bucket ?? storageBucket;
        let downloadUrl: string | null = null;
        if (storagePath && bucket) {
          try {
            downloadUrl = client.storage.from(String(bucket)).getPublicUrl(String(storagePath)).data.publicUrl;
          } catch {
            downloadUrl = null;
          }
        }

        const isPhoto = typeof storagePath === "string" && /\.(jpe?g|heic|heif)$/i.test(storagePath);

        byId.set(rowId, {
          id: d.id ?? rowId,
          title: String(title),
          category,
          uploadedAt,
          dateMs,
          storagePath: typeof storagePath === "string" ? storagePath : null,
          downloadUrl,
          isPhoto,
        });
      }

      const mapped = Array.from(byId.values()).sort((a, b) => b.dateMs - a.dateMs);

      if (!cancelled) {
        setResolvedDocs(mapped);
        setLoading(false);
      }
    }

    void fetchDocuments();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16 font-sans text-center text-slate-700">
        <p className="font-semibold">Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16 font-sans text-center text-slate-600">
        <p className="font-semibold">Loading document library…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:gap-6">
          <button
            type="button"
            onClick={() => setSection151ModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border-2 border-indigo-600 bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:mt-1.5"
          >
            <Plus className="size-4 shrink-0 stroke-[2.5]" aria-hidden />
            <span className="text-left leading-tight">
              <span className="hidden sm:inline">Generate Section 151 Certificate</span>
              <span className="sm:hidden">Section 151 Certificate</span>
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Document Library</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Permanent filing cabinet — upload, permanent records, search, and full archive by category.
            </p>
          </div>
        </div>

        <DocumentsPageClient propertyId={propertyId} initialDocs={resolvedDocs} />
      </main>

      {section151ModalOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="section151-modal-title"
          onClick={() => setSection151ModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="section151-modal-title" className="text-lg font-bold text-slate-900">
              Section 151 certificate
            </h2>
            <p className="mt-3 text-sm font-medium text-slate-600">Section 151 Generator Coming Soon.</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                onClick={() => setSection151ModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
