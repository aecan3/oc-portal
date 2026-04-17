"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocumentListItem } from "../documents/DocumentsPageClient";

type DocumentCategory =
  | "Insurance"
  | "Invoices"
  | "OC Certificates"
  | "Quotes"
  | "Minutes/Agendas"
  | "Rules/Legal"
  | "Valuations"
  | "Plan of Subdivision";

const CATEGORIES: DocumentCategory[] = [
  "Insurance",
  "Invoices",
  "OC Certificates",
  "Quotes",
  "Minutes/Agendas",
  "Rules/Legal",
  "Valuations",
  "Plan of Subdivision",
];

export default function UploadNewDocumentCard({
  propertyId,
  onUploadSuccess,
}: {
  propertyId: string | number | null;
  onUploadSuccess?: (doc: DocumentListItem) => void;
}) {
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [category, setCategory] = useState<DocumentCategory>("Quotes");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onPickFile = (picked: File | null) => {
    setErrorMessage("");
    setStatusMessage("");

    if (!picked) {
      setFile(null);
      return;
    }

    const lowerName = picked.name.toLowerCase();
    const isPdf = picked.type === "application/pdf" || lowerName.endsWith(".pdf");
    const isJpg = picked.type === "image/jpeg" || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");
    const isHeic = lowerName.endsWith(".heic") || lowerName.endsWith(".heif");

    if (!isPdf && !isJpg && !isHeic) {
      setErrorMessage("Please upload a PDF or Photo (JPG/JPEG/HEIC).");
      setFile(null);
      return;
    }

    setFile(picked);
  };

  const upload = async () => {
    setErrorMessage("");
    setStatusMessage("");

    if (!supabase) {
      setErrorMessage("Supabase environment variables are missing.");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Please enter a document title.");
      return;
    }

    if (!file) {
      setErrorMessage("Please choose a PDF or Photo to upload.");
      return;
    }

    setIsUploading(true);
    setProgress(10);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated.");

      const { data: propRows, error: propFetchError } = await supabase
        .from("properties")
        .select("id")
        .order("id", { ascending: true })
        .limit(1);

      if (propFetchError) throw propFetchError;

      const insertPropertyId = propRows?.[0]?.id ?? null;

      if (!insertPropertyId) {
        setErrorMessage(
          "No property row found in the database. Add a row in Table Editor → properties so document uploads can set property_id.",
        );
        return;
      }

      const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_");
      const storagePath = `documents/${user.id}/${Date.now()}-${safeName}`;

      setProgress(45);

      // 1) Upload to storage
      const lowerName = file.name.toLowerCase();
      const contentType = lowerName.endsWith(".pdf")
        ? "application/pdf"
        : lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
          ? "image/jpeg"
          : "image/heic";

      const { error: uploadError } = await supabase.storage
        .from("property-docs")
        .upload(storagePath, file, {
          upsert: false,
          contentType,
        });

      if (uploadError) throw uploadError;

      setProgress(70);

      // 2) Insert a new row into documents table
      const { error: insertError } = await supabase.from("documents").insert({
        title: trimmedTitle,
        category,
        property_id: insertPropertyId,
        uploaded_at: new Date().toISOString(),
        storage_path: storagePath,
      });

      if (insertError) {
        const detail = [
          insertError.message,
          insertError.code ? `code: ${insertError.code}` : "",
          insertError.details ? `details: ${insertError.details}` : "",
          insertError.hint ? `hint: ${insertError.hint}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        alert(`Documents insert failed — full error:\n\n${detail}`);
        throw insertError;
      }

      const uploadTimestamp = Date.now();
      const downloadUrl = supabase.storage
        .from("property-docs")
        .getPublicUrl(storagePath).data.publicUrl;
      const isPhoto = /\.(jpe?g|heic|heif)$/i.test(storagePath);

      setProgress(100);
      setStatusMessage("Upload successful.");

      setTitle("");
      setFile(null);

      onUploadSuccess?.({
        id: `${storagePath}-${uploadTimestamp}`,
        title: trimmedTitle,
        category,
        uploadedAt: new Date(uploadTimestamp).toISOString(),
        dateMs: uploadTimestamp,
        storagePath,
        downloadUrl,
        isPhoto,
      });

      router.refresh();
    } catch (err: any) {
      console.log("Upload error:", err);
      setErrorMessage(err?.message ?? "Upload failed.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Upload New Document
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
            Upload a PDF or Photo to the Document Library
          </h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label
            htmlFor="doc-category"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Category
          </label>
          <select
            id="doc-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="doc-title"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Document Title
          </label>
          <input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Driveway repair invoice Q1"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          File (PDF or Photo)
        </label>

        <div
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            file ? "border-[#4F46E5]/50 bg-[#4F46E5]/5" : "border-slate-200 bg-white/60 hover:bg-white"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const dropped = Array.from(e.dataTransfer.files ?? []);
            onPickFile(dropped[0] ?? null);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const input = document.querySelector<HTMLInputElement>(
                'input[type="file"]#doc-file'
              );
              input?.click();
            }
          }}
          aria-label="Upload PDF file"
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>(
              'input[type="file"]#doc-file'
            );
            input?.click();
          }}
        >
          <p className="text-sm font-semibold text-slate-800">
            {file ? file.name : "Drop a PDF or Photo here"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Or click to choose a file.</p>

          <input
            id="doc-file"
            type="file"
            accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/heic,.heic,image/heif,.heif"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {progress > 0 && isUploading ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Uploading</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#2DD4BF]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="mt-4 rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-4 py-3 text-sm font-semibold text-[#0F766E]">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-[#8B4513]/20 bg-[#8B4513]/5 px-4 py-3 text-sm font-semibold text-[#8B4513]">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5">
        <button
          type="button"
          onClick={() => void upload()}
          disabled={isUploading}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#4F46E5] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? "Uploading..." : "Upload to Portal"}
        </button>
      </div>
    </section>
  );
}

