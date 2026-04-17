"use client";

import { useMemo, useState } from "react";
import ArchiveDocumentRow from "./ArchiveDocumentRow";
import type { DocumentListItem } from "./DocumentsPageClient";

type DocumentRow = DocumentListItem;

const CAT_PLAN = "Plan of Subdivision";
const CAT_RULES = "Rules/Legal";

/** Matches archive row height/padding for seamless empty → filled transition */
const PERMANENT_EMPTY_ROW =
  "list-none flex min-h-[52px] items-center rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50";

const includesQuery = (haystack: string, query: string) =>
  haystack.toLowerCase().includes(query.toLowerCase());

export default function DocumentsListClient({
  docs,
  onDocumentPatched,
  onDocumentRemoved,
}: {
  docs: DocumentRow[];
  onDocumentPatched: (id: string | number, patch: Partial<DocumentListItem>) => void;
  onDocumentRemoved: (id: string | number) => void;
}) {
  const [query, setQuery] = useState("");

  const filteredDocs = useMemo(() => {
    const q = query.trim();
    if (!q) return docs;

    return docs.filter((d) => includesQuery(d.title, q) || includesQuery(d.category, q));
  }, [docs, query]);

  const planDoc = useMemo(
    () => filteredDocs.find((d) => d.category === CAT_PLAN) ?? null,
    [filteredDocs],
  );

  const rulesDoc = useMemo(
    () => filteredDocs.find((d) => d.category === CAT_RULES) ?? null,
    [filteredDocs],
  );

  const archiveGrouped = useMemo(() => {
    const map = new Map<string, DocumentRow[]>();
    for (const doc of filteredDocs) {
      const cat = doc.category.trim() || "Other";
      const list = map.get(cat) ?? [];
      list.push(doc);
      map.set(cat, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.dateMs - a.dateMs);
    }
    const categories = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    return { map, categories };
  }, [filteredDocs]);

  const searchActive = query.trim().length > 0;
  const archiveEmpty = filteredDocs.length === 0;

  return (
    <section className="space-y-8">
      {/* Section 2 — Permanent Records */}
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Permanent Records</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {CAT_PLAN} and {CAT_RULES} — kept in this drawer.
        </p>

        <div className="mt-5 space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{CAT_PLAN}</p>
            <ul className="space-y-2">
              {planDoc ? (
                <ArchiveDocumentRow
                  key={String(planDoc.id)}
                  doc={planDoc}
                  onPatched={onDocumentPatched}
                  onRemoved={onDocumentRemoved}
                />
              ) : (
                <li className={PERMANENT_EMPTY_ROW}>No Plan of Subdivision uploaded yet.</li>
              )}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{CAT_RULES}</p>
            <ul className="space-y-2">
              {rulesDoc ? (
                <ArchiveDocumentRow
                  key={String(rulesDoc.id)}
                  doc={rulesDoc}
                  onPatched={onDocumentPatched}
                  onRemoved={onDocumentRemoved}
                />
              ) : (
                <li className={PERMANENT_EMPTY_ROW}>No Rules/Legal uploaded yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3 — Search & Filter */}
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Search &amp; Filter</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">Filter the full archive by title or category.</p>
        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10"
          />
        </div>
      </div>

      {/* Section 4 — Full Archive */}
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Full Archive</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Every document for this property, grouped by category.
        </p>

        {docs.length === 0 ? (
          <p className="mt-6 text-sm font-semibold text-slate-600">No documents uploaded yet.</p>
        ) : archiveEmpty ? (
          <p className="mt-6 text-sm font-semibold text-slate-600">
            {searchActive ? "No documents match your search — try clearing the filter." : "No documents to show."}
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            {archiveGrouped.categories.map((cat) => {
              const list = archiveGrouped.map.get(cat) ?? [];
              if (list.length === 0) return null;

              return (
                <div key={cat}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{cat}</h3>
                  <ul className="space-y-2">
                    {list.map((doc) => (
                      <ArchiveDocumentRow
                        key={String(doc.id)}
                        doc={doc}
                        onPatched={onDocumentPatched}
                        onRemoved={onDocumentRemoved}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
