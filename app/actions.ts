"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { store, storeBackend } from "@/lib/store";
import { SESSION_COOKIE, sessionToken, checkPassword } from "@/lib/auth";
import { normalizeUrl } from "@/lib/url";

export type ActionState = { error?: string } | null;

/**
 * The local JSON file store can't persist on a serverless host (read-only
 * filesystem). Block writes there with a clear message instead of crashing.
 */
function storageUnavailable(): ActionState {
  if (storeBackend === "file" && process.env.VERCEL) {
    return {
      error:
        "Persistent storage isn't configured. On Vercel, add the Upstash Redis (KV) integration so links can be saved, then redeploy.",
    };
  }
  return null;
}

export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = sessionToken();
  if (!token) {
    return {
      error:
        "This site isn't configured yet: the APP_PASSWORD environment variable is missing. Set it in your hosting provider (e.g. Vercel) and redeploy.",
    };
  }
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "Incorrect password. Please try again." };
  }
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function createCompany(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const unavailable = storageUnavailable();
  if (unavailable) return unavailable;

  const name = String(formData.get("name") ?? "");
  const result = await store.createCompany(name);
  if (!result.ok) return { error: result.error };

  revalidatePath("/");
  redirect(`/companies/${result.value.slug}`);
}

export async function createLink(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const unavailable = storageUnavailable();
  if (unavailable) return unavailable;

  const slug = String(formData.get("slug") ?? "");
  const rawUrl = String(formData.get("original_url") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!slug) return { error: "Missing company. Please reload and retry." };

  const normalized = normalizeUrl(rawUrl);
  if (!normalized) return { error: "Please enter a valid destination URL." };

  const result = await store.createLink(slug, normalized, title || null);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/companies/${slug}`);
  revalidatePath("/");
  return null;
}

export async function renameCompany(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const unavailable = storageUnavailable();
  if (unavailable) return unavailable;

  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "");
  if (!slug) return { error: "Missing company. Please reload and retry." };

  const result = await store.renameCompany(slug, name);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/companies/${slug}`);
  revalidatePath("/");
  return null;
}

export async function deleteCompany(formData: FormData): Promise<void> {
  if (storageUnavailable()) return;

  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;

  await store.deleteCompany(slug);
  revalidatePath("/");
  redirect("/");
}

export async function deleteLink(formData: FormData): Promise<void> {
  if (storageUnavailable()) return;

  const slug = String(formData.get("slug") ?? "");
  const code = String(formData.get("code") ?? "");
  if (!slug || !code) return;

  await store.deleteLink(slug, code);
  revalidatePath(`/companies/${slug}`);
  revalidatePath("/");
  redirect(`/companies/${slug}`);
}
