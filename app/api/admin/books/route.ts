import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminPost } from "@/app/admin/lib/strapi-admin";

async function getToken() {
  const store = await cookies();
  return store.get("dp_admin_token")?.value || "";
}

export async function POST(req: NextRequest) {
  const token = await getToken();
  const body = await req.json();
  const result = await adminPost("/books", body, token);
  if (!result.ok) {
    return NextResponse.json({ error: result.data?.error?.message || "Hata" }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 201 });
}
