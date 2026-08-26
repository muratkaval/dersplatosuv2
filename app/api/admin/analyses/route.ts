import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminPost } from "@/app/admin/lib/strapi-admin";
import { getAdminToken } from "@/app/admin/lib/auth";

function revalidateAnalysisPaths() {
  revalidatePath("/analiz");
  revalidatePath("/analiz/[analiz]", "page");
  revalidatePath("/analiz/[analiz]/[rota]", "page");
}

export async function POST(req: NextRequest) {
  const token = await getAdminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const res = await adminPost("/analyses", body, token);
  if (!res.ok) {
    return NextResponse.json(
      { error: res.data?.error?.message || "Kayıt edilemedi" },
      { status: res.status }
    );
  }
  revalidateAnalysisPaths();
  return NextResponse.json({ success: true, data: res.data });
}
