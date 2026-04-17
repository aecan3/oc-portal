import DocumentsLibraryClient from "./DocumentsLibraryClient";

/** Upload + insert: `UploadNewDocumentCard` — `property_id` comes from `properties.id` (loaded in `DocumentsLibraryClient`, with a fetch fallback before insert). */
export default function DocumentsPage() {
  return <DocumentsLibraryClient />;
}
