import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "fta_session";

function appPassword(): string {
  const pwd = process.env.APP_PASSWORD;
  if (!pwd) {
    throw new Error("Missing APP_PASSWORD. Add it to .env.local (see .env.example).");
  }
  return pwd;
}

/** Opaque token derived from the password; can't be forged without knowing it. */
export function sessionToken(): string {
  return createHash("sha256").update(`fta:${appPassword()}`).digest("hex");
}

export function checkPassword(candidate: string): boolean {
  return candidate === appPassword();
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === sessionToken();
}
