import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "fta_session";

/** The configured password, or null when the server hasn't been set up. */
function appPassword(): string | null {
  return process.env.APP_PASSWORD || null;
}

/** True when APP_PASSWORD is configured. */
export function isConfigured(): boolean {
  return appPassword() !== null;
}

/** Opaque token derived from the password; null when unconfigured. */
export function sessionToken(): string | null {
  const pwd = appPassword();
  if (!pwd) return null;
  return createHash("sha256").update(`fta:${pwd}`).digest("hex");
}

export function checkPassword(candidate: string): boolean {
  const pwd = appPassword();
  if (!pwd) return false;
  return candidate === pwd;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = sessionToken();
  if (!token) return false;
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === token;
}
