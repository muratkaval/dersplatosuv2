import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminPost, adminGet } from "@/app/admin/lib/strapi-admin";

async function getToken() {
  const store = await cookies();
  return store.get("dp_admin_token")?.value || "";
}

export async function GET(req: NextRequest) {
  const token = await getToken();
  const url = new URL(req.url);
  const result = await adminGet(`/camps${url.search}`, token);
  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(req: NextRequest) {
  const token = await getToken();
  const body = await req.json();
  const result = await adminPost("/camps", body, token);
  if (!result.ok) {
    return NextResponse.json({ error: result.data?.error?.message || "Hata" }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 201 });
}
