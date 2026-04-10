import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyApiAccess } from "@/app/admin/lib/auth";

export async function POST(req: NextRequest) {
  const store = await cookies();
  const token = store.get("dp_admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const rawBase = process.env.STRAPI_URL || "http://localhost:1340";
    const strapiOrigin = rawBase.replace(/\/api\/?$/, "");

    const res = await fetch(`${strapiOrigin}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
