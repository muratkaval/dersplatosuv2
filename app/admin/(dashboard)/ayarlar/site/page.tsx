import React from "react";
// Cache bust to fix Turbopack AST issue
import { cookies } from "next/headers";
// Göreli import yolu kullanılarak önbellek sorunlarının önüne geçildi
import { getGlobalSettings } from "../../../../lib/strapi";
import { SiteForm } from "./site-form";
import Link from "next/link";

export default async function SiteManagementPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  // Veriyi çekiyoruz
  const initialData = await getGlobalSettings();

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/ayarlar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Ayarlar
            </Link>
          </div>
          <h1><span className="ms">view_quilt</span> Site Düzenleme</h1>
          <p>Ana sayfadaki metinleri ve butonları buradan düzenle.</p>
        </div>
      </div>

      <div className="admin-content">
        <SiteForm initialData={initialData} token={token || ""} />
      </div>
    </>
  );
}
