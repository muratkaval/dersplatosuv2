import { NextRequest, NextResponse } from "next/server";
import { adminDelete, adminPut } from "@/app/admin/lib/strapi-admin";
import { getAdminToken } from "@/app/admin/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAdminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await adminDelete(`/exams/${id}`, token);
  if (!res.ok) return NextResponse.json({ error: "Silinemedi" }, { status: res.status });
  return NextResponse.json({ success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAdminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const res = await adminPut(`/exams/${id}`, body, token);

  if (!res.ok) {
    return NextResponse.json(
      { error: res.data?.error?.message || "Güncellenemedi" },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true, data: res.data });
}
