/**
 * Build rules shared by the browser form and the API routes.
 *
 * These used to live in `lib/submissions.ts`, which starts with
 * `import "server-only"` — so the submit form could not read them and had its
 * own hardcoded copy of the size and the extension list. Two copies of a limit
 * drift: the form would happily accept a file the route then rejects, and the
 * player only finds out after uploading it. One module, no `server-only`, both
 * sides import the same numbers.
 */

export const MAX_BUILD_SIZE = 500 * 1024 * 1024;
export const ALLOWED_BUILD_EXTENSIONS = [".zip", ".rar", ".7z", ".exe"];

export function safeBuildName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

/** The matching allowed extension, or undefined if the file is not a build. */
export function buildExtension(name: string) {
  const lower = name.toLowerCase();
  return ALLOWED_BUILD_EXTENSIONS.find((extension) => lower.endsWith(extension));
}

/** "412.6 MB" — for the drop zone, so the size limit is never abstract. */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
