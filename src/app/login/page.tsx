"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

type AuthMode = "accounts" | "password" | "off";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/control";

  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/status")
      .then((response) => response.json())
      .then((data: { mode?: AuthMode }) => setAuthMode(data.mode ?? "password"))
      .catch(() => setAuthMode("password"));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const accounts = authMode === "accounts";
    try {
      const res = await fetch(
        accounts && creating ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            accounts
              ? {
                  email,
                  password,
                  displayName: creating ? displayName : undefined,
                }
              : { password },
          ),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Anmeldung fehlgeschlagen.");
        return;
      }
      router.replace(from.startsWith("/") ? from : "/control");
      router.refresh();
    } catch {
      setError("Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  if (!authMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Laden…
      </div>
    );
  }

  const accounts = authMode === "accounts";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl"
      >
        <h1 className="text-2xl font-black text-white">
          {creating ? "Konto erstellen" : "Control Login"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Zugriff auf die Live-Steuerung. Das OBS-Overlay bleibt ohne Login
          erreichbar.
        </p>

        {accounts && (
          <label className="mt-6 block text-sm text-zinc-300">
            E-Mail
            <input
              type="email"
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-4 py-3 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        )}

        {accounts && creating && (
          <label className="mt-4 block text-sm text-zinc-300">
            Anzeigename
            <input
              type="text"
              autoComplete="nickname"
              className="mt-2 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-4 py-3 text-white"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
        )}

        <label className="mt-4 block text-sm text-zinc-300">
          Passwort
          <input
            type="password"
            autoComplete={creating ? "new-password" : "current-password"}
            className="mt-2 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-4 py-3 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={accounts ? 8 : undefined}
          />
        </label>

        {error && (
          <p className="mt-3 text-sm font-medium text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? "Bitte warten…" : creating ? "Registrieren" : "Anmelden"}
        </button>

        {accounts && (
          <button
            type="button"
            className="mt-4 w-full text-sm text-zinc-400 hover:text-white"
            onClick={() => {
              setCreating((value) => !value);
              setError(null);
            }}
          >
            {creating
              ? "Schon ein Konto? Anmelden"
              : "Noch kein Konto? Registrieren"}
          </button>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
          Laden…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
