"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { SESSION_COOKIE, sessionToken, checkPassword } from "@/lib/auth";
import { normalizeUrl } from "@/lib/url";

export type ActionState = { error?: string } | null;

export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "Incorrect password. Please try again." };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function createCompany(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
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
