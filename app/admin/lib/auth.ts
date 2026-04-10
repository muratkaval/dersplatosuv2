"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { strapiLogin } from "./strapi-admin";

const SESSION_COOKIE = "dp_admin_token";

export async function getAdminToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

export async function requireAdminToken(): Promise<string> {
  const token = await getAdminToken();
  if (!token) redirect("/admin/login");
  return token;
}

export async function verifyApiAccess(): Promise<string | null> {
  const token = await getAdminToken();
  if (!token) return null;

  try {
    const rawBase = process.env.STRAPI_URL || "http://localhost:1340";
    const strapiOrigin = rawBase.replace(/\/api\/?$/, "");
    const res = await fetch(`${strapiOrigin}/api/users/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    
    // 401 means invalid or expired token.
    // 403 means valid token but insufficient permissions for /users/me.
    // 200 means valid token and has permission.
    if (res.ok || res.status === 403) {
      return token;
    }
    
    console.error(`[auth] verifyApiAccess failed: ${res.status} ${res.statusText}`);
    return null;
  } catch (err) {
    console.error("[auth] verifyApiAccess error:", err);
    return null;
  }
}

export async function loginAction(_prevState: any, formData: FormData) {
  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Kullanıcı adı ve şifre zorunludur." };
  }

  try {
    const data = await strapiLogin(identifier, password);
    if (!data.jwt) {
      return { error: data?.error?.message || "Kullanıcı adı veya şifre hatalı." };
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, data.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  } catch {
    return { error: "Bağlantı hatası oluştu." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
