"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase";
import { DragEvent, useMemo, useState } from "react";

type Category =
  | "Insurance"
  | "Compliance"
  | "Invoices"
  | "OC Certificates"
  | "Quotes"
  | "Minutes/Agendas"
  | "Plan of Subdivision"
  | "Rules/Legal"
  | "Valuations";

const CATEGORIES: Category[] = [
  "Insurance",
  "Compliance",
  "Invoices",
  "OC Certificates",
  "Quotes",
  "Minutes/Agendas",
  "Plan of Subdivision",
  "Rules/Legal",
  "Valuations",
];

export default function DocumentUploadDropzone({
  canUpload,
  storageBucket,
}: {
  canUpload: boolean;
  storageBucket: string;
}) {
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<Category>("Quotes");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");

  if (!canUpload) return null;

  const onPickFile = (picked: File | null) => {
    setStatusMessage("");
    if (!picked) {
      setFile(null);
      return;
    }

    const looksLikePdf =
      picked.type === "application/pdf" || picked.name.toLowerCase().endsWith(".pdf");

    if (!looksLikePdf) {
      setStatusMessage("Please upload a PDF document.");
      setFile(null);
      return;
    }

    setFile(picked);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files ?? []);
    onPickFile(droppedFiles[0] ?? null);
  };

  const upload = async () => {
    if (!supabase) {
      setStatusMessage("Supabase environment variables are missing.");
      return;
    }
    if (!file) {
      setStatusMessage("Drop a document file first.");
      return;
    }

    setIsUploading(true);
    setStatusMessage("");
    setUploadProgress(5);

    try {
      const bucket = storageBucket || "property-docs";

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated.");

      const { data: propRows, error: propError } = await supabase
        .from("properties")
        .select("id")
        .order("id", { ascending: true })
        .limit(1);

      if (propError) throw propError;
      const propertyId = propRows?.[0]?.id ?? null;
      if (!propertyId) throw new Error("No property found to attach this document.");

      const ext = file.name.includes(".") ? file.name.split(".").pop() : undefined;
      const safeExt = ext ? `.${ext}` : "";

      const storagePath = `documents/${user.id}/${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // Best-effort insert. If your schema differs, we’ll surface the Supabase error.
      const { error: insertError } = await supabase.from("documents").insert({
        title: file.name.replace(safeExt, ""),
        category: selectedCategory,
        uploaded_at: new Date().toISOString(),
        file_path: storagePath,
        property_id: propertyId,
      });

      if (insertError) throw insertError;

      setUploadProgress(100);
      setStatusMessage("Upload complete.");
      setFile(null);
    } catch (err: any) {
      console.log("Document upload error:", err);
      setStatusMessage(err?.message ?? "Upload failed.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 800);
    }
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Upload
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
            Drag & Drop PDF Documents
          </h2>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <div
          onDragEnter={() => setDragActive(true)}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-6 text-center transition ${
            dragActive
              ? "border-[#2DD4BF] bg-[#2DD4BF]/10"
              : "border-dashed border-slate-200 bg-white/60 hover:bg-white"
          }`}
        >
          <p className="text-sm font-semibold text-slate-800">
            {file ? file.name : "Drop your PDF here"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Or click to choose a PDF.
          </p>

          <input
            type="file"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            accept="application/pdf,.pdf"
          />

          <div className="mt-4 w-full">
            <button
              type="button"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>(
                  'input[type="file"]'
                );
                input?.click();
              }}
              disabled={isUploading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#4F46E5] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>

        {isUploading ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Uploading</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#2DD4BF]"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {statusMessage ? (
          <div className="mt-4 rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-4 py-3 text-sm font-semibold text-[#0F766E]">
            {statusMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}

