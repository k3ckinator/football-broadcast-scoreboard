"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthStatus = {
  authEnabled: boolean;
  authenticated: boolean;
  user?: { displayName: string } | null;
};

export function ControlAuthMenu() {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    void fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data: AuthStatus) => setStatus(data))
      .catch(() => setStatus({ authEnabled: false, authenticated: true }));
  }, []);

  if (!status?.authEnabled) return null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      {!status.authenticated && (
        <Link
          href="/login"
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold text-white"
        >
          Login
        </Link>
      )}
      {status.authenticated && (
        <>
          {status.user?.displayName && (
            <span className="text-sm text-zinc-300">
              {status.user.displayName}
            </span>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200"
          >
            Abmelden
          </button>
        </>
      )}
    </div>
  );
}
