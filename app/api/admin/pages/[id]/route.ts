import { NextRequest, NextResponse } from "next/server";
import { adminPut, adminDelete } from "@/app/admin/lib/strapi-admin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const result = await adminPut(`/pages/${id}`, body, "");
  if (!result.ok) {
    return NextResponse.json({ error: result.data?.error?.message || "Güncelleme hatası" }, { status: result.status });
  }
  return NextResponse.json(result.data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await adminDelete(`/pages/${id}`, "");
  if (!result.ok) {
    return NextResponse.json({ error: "Silme hatası" }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}
