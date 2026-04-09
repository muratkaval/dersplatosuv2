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
