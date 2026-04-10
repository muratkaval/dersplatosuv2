import { NextRequest, NextResponse } from "next/server";
import { adminPut } from "@/app/admin/lib/strapi-admin";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  // Call adminPut on the server so it has access to process.env.STRAPI_TOKEN
  const result = await adminPut("/global-setting", body, "");
  if (!result.ok) {
    return NextResponse.json({ error: result.data?.error?.message || "Hata" }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
