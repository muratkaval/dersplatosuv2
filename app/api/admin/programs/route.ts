import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminPost } from "@/app/admin/lib/strapi-admin";
import { getAdminToken } from "@/app/admin/lib/auth";

export async function POST(req: NextRequest) {
  const token = await getAdminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const res = await adminPost("/programs", body, token);
  if (!res.ok) {
    return NextResponse.json(
      { error: res.data?.error?.message || "Kayıt edilemedi" },
      { status: res.status }
    );
  }

  // Public /programlar verisi 60 sn cache'li (strapi.ts fetchStrapi revalidate:60).
  // Yeni programın 1 dk beklemeden görünmesi için listeyi ve detay sayfalarını anında tazele.
  revalidatePath("/programlar");
  revalidatePath("/programlar/[slug]", "page");
  revalidatePath("/canli-deneme");
  revalidatePath("/canli-deneme/[slug]", "page");

  return NextResponse.json({ success: true, data: res.data });
}
