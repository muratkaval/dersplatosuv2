import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminPut, adminDelete } from "@/app/admin/lib/strapi-admin";
import { getAdminToken } from "@/app/admin/lib/auth";

function revalidateAnalysisPaths() {
  revalidatePath("/analiz");
  revalidatePath("/analiz/[analiz]", "page");
  revalidatePath("/analiz/[analiz]/[rota]", "page");
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAdminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const res = await adminPut(`/analyses/${id}`, body, token);
  if (!res.ok) {
    return NextResponse.json(
      { error: res.data?.error?.message || "Güncellenemedi" },
      { status: res.status }
    );
  }
  revalidateAnalysisPaths();
  return NextResponse.json({ success: true, data: res.data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAdminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await adminDelete(`/analyses/${id}`, token);
  if (!res.ok) return NextResponse.json({ error: "Silinemedi" }, { status: res.status });
  revalidateAnalysisPaths();
  return NextResponse.json({ success: true });
}
