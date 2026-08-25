import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const store = await cookies();
  // Giriş kontrolü (admin oturumu var mı?)
  const loggedIn = store.get("dp_admin_token")?.value;
  if (!loggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const rawBase = process.env.STRAPI_URL || "http://localhost:1340";
    const strapiOrigin = rawBase.replace(/\/api\/?$/, "");
    // Strapi'ye yuklerken, diger tum admin kayit islemleriyle AYNI env token'i kullan.
    // (Onceden cookie token'i kullaniliyordu; prod'da Strapi /api/upload bunu
    //  reddedip yuklemeyi bosa dusuruyordu -> logolar kaydedilmiyordu.)
    const strapiToken = (process.env.STRAPI_TOKEN || "").trim();

    const res = await fetch(`${strapiOrigin}/api/upload`, {
      method: "POST",
      headers: strapiToken ? { Authorization: `Bearer ${strapiToken}` } : {},
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
