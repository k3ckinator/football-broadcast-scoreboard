/** Control-panel login is off until an auth server or CONTROL_ACCESS_PASSWORD is set. */

export const CONTROL_SESSION_COOKIE = "scoreboard_control_session";

/** When set, accounts live in scoreboard-auth and this URL wins over the shared password. */
export function getAuthApiUrl(): string | null {
  const value = process.env.AUTH_API_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

export function isControlAuthEnabled(): boolean {
  return Boolean(getAuthApiUrl() || process.env.CONTROL_ACCESS_PASSWORD?.trim());
}

export function getControlAccessPassword(): string | null {
  const value = process.env.CONTROL_ACCESS_PASSWORD?.trim();
  return value || null;
}

export function getAuthSecret(): string {
  const secret = process.env.CONTROL_AUTH_SECRET?.trim();
  if (secret) return secret;
  const password = getControlAccessPassword();
  if (password) return password;
  return "scoreboard-dev-auth-disabled";
}
