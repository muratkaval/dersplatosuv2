import { NextRequest, NextResponse } from "next/server";
import { adminPost, adminPut, adminDelete, adminGet } from "@/app/admin/lib/strapi-admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await adminPost("/pages", body, "");
  if (!result.ok) {
    return NextResponse.json({ error: result.data?.error?.message || "Oluşturma hatası" }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
