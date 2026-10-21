import { getAuthApiUrl } from "@/lib/auth/config";

export type RemoteUser = {
  id: string;
  email: string;
  displayName: string;
};

export type RemoteAuthResult =
  | { ok: true; token: string; expiresAt?: number; user: RemoteUser }
  | { ok: false; status: number; error: string };

export async function remoteRegister(input: {
  email: string;
  password: string;
  displayName?: string;
  registrationCode?: string;
}): Promise<RemoteAuthResult> {
  return postAuth("/auth/register", input);
}

export async function remoteLogin(
  email: string,
  password: string,
): Promise<RemoteAuthResult> {
  return postAuth("/auth/login", { email, password });
}

export async function remoteLogout(token: string): Promise<void> {
  const base = getAuthApiUrl();
  if (!base) return;
  try {
    await fetch(`${base}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    // The local cookie is cleared even if the auth server is down.
  }
}

export async function remoteCurrentUser(
  token: string,
): Promise<RemoteUser | null> {
  const base = getAuthApiUrl();
  if (!base) return null;
  try {
    const response = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { user?: RemoteUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function sessionMaxAgeSeconds(expiresAt: number | undefined): number {
  if (!expiresAt) return 7 * 24 * 60 * 60;
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

async function postAuth(
  path: string,
  body: unknown,
): Promise<RemoteAuthResult> {
  const base = getAuthApiUrl();
  if (!base) {
    return {
      ok: false,
      status: 503,
      error: "Auth-Server ist nicht konfiguriert.",
    };
  }

  try {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      token?: string;
      expiresAt?: number;
      user?: RemoteUser;
    };
    if (!response.ok || typeof data.token !== "string" || !data.user) {
      return {
        ok: false,
        status: response.ok ? 502 : response.status,
        error: data.error ?? "Anmeldung fehlgeschlagen.",
      };
    }
    return {
      ok: true,
      token: data.token,
      expiresAt: data.expiresAt,
      user: data.user,
    };
  } catch {
    return {
      ok: false,
      status: 503,
      error: "Auth-Server ist nicht erreichbar.",
    };
  }
}
