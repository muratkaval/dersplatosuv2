import { verifyApiAccess } from "@/app/admin/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { adminPut } from "@/app/admin/lib/strapi-admin";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  console.log("PUT /api/admin/global-setting payload:", JSON.stringify(body, null, 2));
  
  // Call adminPut on the server so it has access to process.env.STRAPI_TOKEN
  const result = await adminPut("/global-setting", body, "");
  
  if (!result.ok) {
    console.error("Strapi error in global-setting PUT:", result.status, JSON.stringify(result.data, null, 2));
    return NextResponse.json({ error: result.data?.error?.message || "Strapi API Hatası" }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
