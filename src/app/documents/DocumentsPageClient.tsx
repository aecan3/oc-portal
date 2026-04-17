"use client";

import { useEffect, useState } from "react";
import DocumentsListClient from "./DocumentsListClient";
import UploadNewDocumentCard from "../components/UploadNewDocumentCard";

export type DocumentListItem = {
  id: string | number;
  title: string;
  category: string;
  uploadedAt: unknown;
  dateMs: number;
  storagePath: string | null;
  downloadUrl: string | null;
  isPhoto?: boolean;
};

export default function DocumentsPageClient({
  propertyId,
  initialDocs,
}: {
  propertyId: string | number | null;
  initialDocs: DocumentListItem[];
}) {
  const [docs, setDocs] = useState<DocumentListItem[]>(initialDocs);

  useEffect(() => {
    setDocs(initialDocs);
  }, [initialDocs]);

  const onDocumentPatched = (id: string | number, patch: Partial<DocumentListItem>) => {
    setDocs((prev) =>
      prev.map((d) => (String(d.id) === String(id) ? { ...d, ...patch } : d)),
    );
  };

  const onDocumentRemoved = (id: string | number) => {
    setDocs((prev) => prev.filter((d) => String(d.id) !== String(id)));
  };

  return (
    <div className="space-y-8">
      <UploadNewDocumentCard
        propertyId={propertyId}
        onUploadSuccess={(newDoc) => {
          setDocs((current) => {
            const withoutDuplicate = current.filter((doc) => doc.id !== newDoc.id);
            return [newDoc, ...withoutDuplicate].sort((a, b) => b.dateMs - a.dateMs);
          });
        }}
      />

      <DocumentsListClient
        docs={docs}
        onDocumentPatched={onDocumentPatched}
        onDocumentRemoved={onDocumentRemoved}
      />
    </div>
  );
}

