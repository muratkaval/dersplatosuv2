import { NextRequest, NextResponse } from "next/server";
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

  return NextResponse.json({ success: true, data: res.data });
}
