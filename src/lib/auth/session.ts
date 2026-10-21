const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return base64UrlEncode(new Uint8Array(sig));
}

function encodePayload(exp: number): string {
  return btoa(JSON.stringify({ v: 1, exp }));
}

function decodePayload(payload: string): { exp: number } | null {
  try {
    const parsed = JSON.parse(atob(payload)) as { exp?: number };
    if (typeof parsed.exp !== "number") return null;
    return { exp: parsed.exp };
  } catch {
    return null;
  }
}

export async function createSessionToken(secret: string): Promise<string> {
  const payload = encodePayload(Date.now() + SESSION_TTL_MS);
  const signature = await hmacSign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = await hmacSign(payload, secret);
  if (signature !== expected) return false;
  const data = decodePayload(payload);
  return data !== null && data.exp > Date.now();
}
