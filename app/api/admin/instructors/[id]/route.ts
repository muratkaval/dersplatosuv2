import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminPut, adminDelete } from "@/app/admin/lib/strapi-admin";

async function getToken() {
  const store = await cookies();
  return store.get("dp_admin_token")?.value || "";
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken();
  const body = await req.json();
  const result = await adminPut(`/instructors/${id}`, body, token);
  if (!result.ok) {
    return NextResponse.json({ error: result.data?.error?.message || "Güncelleme hatası" }, { status: result.status });
  }
  return NextResponse.json(result.data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken();
  const result = await adminDelete(`/instructors/${id}`, token);
  if (!result.ok) {
    return NextResponse.json({ error: "Silinmedi" }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}
