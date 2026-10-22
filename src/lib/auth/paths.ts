/** Routes that stay public when control auth is enabled (OBS overlay, logo delivery). */

export function isControlAuthPublicPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/overlay")) return true;
  if (pathname.startsWith("/api/uploads/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}

export function isControlAuthProtectedPath(pathname: string): boolean {
  if (pathname === "/control" || pathname.startsWith("/control/")) return true;
  if (pathname === "/api/upload" || pathname.startsWith("/api/upload/")) {
    return true;
  }
  if (pathname === "/api/boards" || pathname.startsWith("/api/boards/")) {
    return true;
  }
  return false;
}
