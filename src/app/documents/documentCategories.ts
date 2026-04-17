export const DOCUMENT_CATEGORIES = [
  "Insurance",
  "Invoices",
  "OC Certificates",
  "Quotes",
  "Minutes/Agendas",
  "Rules/Legal",
  "Valuations",
  "Plan of Subdivision",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
