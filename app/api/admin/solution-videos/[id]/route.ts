import { NextRequest, NextResponse } from "next/server";
import { verifyApiAccess } from "@/app/admin/lib/auth";
import { adminPut, adminDelete } from "@/app/admin/lib/strapi-admin";



export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await verifyApiAccess();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const result = await adminPut(`/solution-videos/${id}`, body, token);
  if (!result.ok) {
    return NextResponse.json({ error: result.data?.error?.message || "Güncelleme hatası" }, { status: result.status });
  }
  return NextResponse.json(result.data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await verifyApiAccess();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await adminDelete(`/solution-videos/${id}`, token);
  if (!result.ok) {
    return NextResponse.json({ error: "Silinmedi" }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}
