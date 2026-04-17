"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type DocumentRow = {
  id: string | number;
  title: string | null;
  storage_path: string | null;
  bucket: string | null;
  uploaded_at: string | null;
  created_at: string | null;
};

function toTimestamp(value: unknown) {
  const parsed = new Date(String(value ?? ""));
  const ms = parsed.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function formatRecentUploadDate(value: unknown) {
  const ms = toTimestamp(value);
  if (!ms) return "Date unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

function createClientComponentClient() {
  return createBrowserSupabaseClient();
}

export default function RecordsAccessCard() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchRecentDocuments() {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      console.log("DASHBOARD FETCH RESULT:", { data, error });

      if (!mounted) return;
      setDocs(Array.isArray(data) ? (data as DocumentRow[]) : []);
      setLoading(false);
    }

    void fetchRecentDocuments();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <article className="flex h-full min-h-0 flex-col rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Documents</p>
      <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Records Access</h2>

      <div className="mt-4 flex flex-1 flex-col">
        {loading ? (
          <p className="text-sm font-medium text-slate-500">Loading recent uploads...</p>
        ) : docs.length === 0 ? (
          <p className="text-sm font-medium text-slate-500">No recent uploads.</p>
        ) : (
          <ul className="space-y-1.5">
            {docs.map((doc) => {
              const storagePath = typeof doc.storage_path === "string" ? doc.storage_path : null;
              const bucket = typeof doc.bucket === "string" && doc.bucket ? doc.bucket : "property-docs";
              const downloadUrl = storagePath
                ? supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
                : null;

              return (
                <li key={String(doc.id)}>
                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-row items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition hover:bg-slate-100"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <FileText className="size-4 shrink-0 text-slate-400" aria-hidden />
                        <span className="block min-w-0 truncate text-sm font-medium text-slate-700">
                          {doc.title || "Untitled Document"}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-sm text-gray-500">
                        {formatRecentUploadDate(doc.created_at ?? doc.uploaded_at)}
                      </span>
                    </a>
                  ) : (
                    <div className="flex flex-row items-center justify-between gap-3 rounded-lg px-2.5 py-2">
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <FileText className="size-4 shrink-0 text-slate-400" aria-hidden />
                        <span className="block min-w-0 truncate text-sm font-medium text-slate-700">
                          {doc.title || "Untitled Document"}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-sm text-gray-500">
                        {formatRecentUploadDate(doc.created_at ?? doc.uploaded_at)}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-auto flex w-full flex-col gap-3 pt-6 md:w-auto md:flex-row">
          <Link
            href="/documents"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-600 bg-white px-4 py-3.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 md:w-auto"
          >
            View Document Library
          </Link>
        </div>
      </div>
    </article>
  );
}
