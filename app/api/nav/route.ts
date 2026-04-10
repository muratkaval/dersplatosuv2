import { NextResponse } from "next/server";
import { adminGet } from "@/app/admin/lib/strapi-admin";

export async function GET() {
  try {
    const res = await adminGet("/global-setting", "");
    const data = res.data?.data || {};
    return NextResponse.json({
      navLinks: data.navLinks || null,
      footerColumns: data.footerColumns || null,
    });
  } catch {
    return NextResponse.json({ navLinks: null, footerColumns: null });
  }
}
