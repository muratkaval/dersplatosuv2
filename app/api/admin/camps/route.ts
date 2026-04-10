import { NextRequest, NextResponse } from "next/server";
import { verifyApiAccess } from "@/app/admin/lib/auth";
import { adminPost, adminGet } from "@/app/admin/lib/strapi-admin";



export async function GET(req: NextRequest) {
  const token = await verifyApiAccess();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const result = await adminGet(`/camps${url.search}`, token);
  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(req: NextRequest) {
  const token = await verifyApiAccess();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const result = await adminPost("/camps", body, token);
  if (!result.ok) {
    return NextResponse.json({ error: result.data?.error?.message || "Hata" }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: 201 });
}
