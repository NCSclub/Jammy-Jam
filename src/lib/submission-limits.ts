/**
 * What a team may attach to a submission, shared by the browser form and the
 * API routes.
 *
 * No `server-only` here on purpose: the form needs the same extension lists
 * and size caps the routes enforce. When the two were separate, the form
 * advertised limits the server did not agree with, and a player only found out
 * after sitting through the upload.
 *
 * Every upload is validated by extension, not by the MIME type the browser
 * reports — browsers disagree wildly about archives (`.7z` arrives as
 * `application/x-7z-compressed`, `application/octet-stream` or empty depending
 * on the OS), so a MIME whitelist rejects perfectly good builds.
 */

const MB = 1024 * 1024;

export type AssetKind = "build" | "cover" | "report" | "deck";

export type AssetSpec = {
  /** Shown in progress copy: "Uploading cover — 42%". */
  label: string;
  /** Top-level folder inside the bucket, so the four kinds stay separable. */
  folder: string;
  extensions: readonly string[];
  maxSize: number;
  /** `accept` for the file input. */
  accept: string;
  /** The line under the drop zone. Formats only — the caps are enforced but
      never advertised, so the zones stay quiet. */
  hint: string;
};

/** How many extra links a team may tack on at the end. */
export const MAX_OTHER_LINKS = 6;

export const ASSETS: Record<AssetKind, AssetSpec> = {
  build: {
    label: "build",
    folder: "builds",
    extensions: [".zip", ".rar", ".7z"],
    maxSize: 500 * MB,
    accept: ".zip,.rar,.7z",
    hint: ".ZIP .RAR .7Z",
  },
  cover: {
    label: "cover",
    folder: "covers",
    extensions: [".png", ".jpg", ".jpeg", ".webp"],
    maxSize: 10 * MB,
    accept: "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp",
    hint: ".PNG .JPG .WEBP",
  },
  report: {
    label: "report",
    folder: "reports",
    extensions: [".pdf", ".doc", ".docx", ".odt", ".md", ".txt"],
    maxSize: 50 * MB,
    accept: ".pdf,.doc,.docx,.odt,.md,.txt",
    hint: ".PDF .DOC .DOCX",
  },
  deck: {
    label: "presentation",
    folder: "decks",
    extensions: [".pdf", ".ppt", ".pptx", ".odp", ".key"],
    maxSize: 100 * MB,
    accept: ".pdf,.ppt,.pptx,.odp,.key",
    hint: ".PDF .PPT .PPTX",
  },
};

export function isAssetKind(value: unknown): value is AssetKind {
  return typeof value === "string" && value in ASSETS;
}

/** The matching allowed extension for that kind, or undefined. */
export function assetExtension(kind: AssetKind, name: string) {
  const lower = name.toLowerCase();
  return ASSETS[kind].extensions.find((extension) => lower.endsWith(extension));
}

export function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

/** "412.6 MB" — so a size limit is never abstract. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

/** Report and deck may be a link instead of a file — but only a real one. */
export function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
