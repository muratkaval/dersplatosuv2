import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminDelete, adminPut } from "@/app/admin/lib/strapi-admin";
import { getAdminToken } from "@/app/admin/lib/auth";

// Public /programlar verisi 60 sn cache'li (strapi.ts fetchStrapi revalidate:60).
// Düzenleme/silme sonrası değişikliğin anında yansıması için cache'i tazele.
function revalidateProgramPaths() {
  revalidatePath("/programlar");
  revalidatePath("/programlar/[slug]", "page");
  revalidatePath("/analiz");
  revalidatePath("/analiz/[analiz]", "page");
  revalidatePath("/analiz/[analiz]/[rota]", "page");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAdminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await adminDelete(`/programs/${id}`, token);
  if (!res.ok) return NextResponse.json({ error: "Silinemedi" }, { status: res.status });
  revalidateProgramPaths();
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
  const res = await adminPut(`/programs/${id}`, body, token);

  if (!res.ok) {
    return NextResponse.json(
      { error: res.data?.error?.message || "Güncellenemedi" },
      { status: res.status }
    );
  }

  revalidateProgramPaths();
  return NextResponse.json({ success: true, data: res.data });
}
