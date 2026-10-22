import "server-only";

import { cookies } from "next/headers";
import {
  CONTROL_SESSION_COOKIE,
  getAuthApiUrl,
  getAuthSecret,
  isControlAuthEnabled,
} from "@/lib/auth/config";
import { remoteCurrentUser } from "@/lib/auth/remote";
import { verifySessionToken } from "@/lib/auth/session";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(CONTROL_SESSION_COOKIE)?.value;
  if (!token) return null;

  if (getAuthApiUrl()) {
    const user = await remoteCurrentUser(token);
    return user;
  }

  if (!isControlAuthEnabled()) {
    return { id: "local", email: "local@control", displayName: "Local" };
  }

  const ok = await verifySessionToken(token, getAuthSecret());
  if (!ok) return null;
  return { id: "shared-password", email: "control@local", displayName: "Control" };
}
