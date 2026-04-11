import { NextResponse } from "next/server";
import { adminGet } from "@/app/admin/lib/strapi-admin";

export async function GET() {
  try {
    // Populate is needed to get the logo and deep fields
    const res = await adminGet("/global-setting?populate=*", "");
    const data = res.data?.data || res.data || {};
    
    return NextResponse.json({
      navLinks: data.navLinks || null,
      footerColumns: data.footerColumns || null,
      footer_title: data.footer_title || null,
      footer_description: data.footer_description || null,
      logo: data.logo || null,
    });
  } catch {
    return NextResponse.json({ navLinks: null, footerColumns: null });
  }
}
