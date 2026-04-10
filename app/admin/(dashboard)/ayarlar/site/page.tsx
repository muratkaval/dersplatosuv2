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
    <div className="admin-container">
      <div className="topbar-title" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Link href="/admin/ayarlar" className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>
            <span className="ms" style={{ fontSize: "18px" }}>arrow_back</span>
            Ayarlar
          </Link>
        </div>
        <h1><span className="ms">dvr</span> Site Düzenleme</h1>
        <p>Ana sayfadaki metinleri ve butonları buradan düzenle.</p>
      </div>

      <SiteForm initialData={initialData} token={token || ""} />
    </div>
  );
}
