/** Map legacy /uploads/… URLs to the API route (needed on Plesk/Apache). */
export function resolveLogoUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/api/uploads/")) return url;
  if (url.startsWith("/uploads/")) {
    return `/api/uploads/${url.slice("/uploads/".length)}`;
  }
  return url;
}
