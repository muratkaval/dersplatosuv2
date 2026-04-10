import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import SeoForm from "./seo-form";

export const metadata = { title: "SEO & Kod Yönetimi | Admin" };

export default async function SeoSettingsPage() {
  const token = await requireAdminToken();

  // Fetch the global settings single type
  const res = await adminGet("/global-setting?populate=*", token);
  const settings = res.data?.data || null;

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/ayarlar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Geri
            </Link>
          </div>
          <h1><span className="ms">language</span> SEO & Kod Yönetimi</h1>
          <p>Arama motoru optimizasyonu ve analitik takip ayarlarını buradan yönetin.</p>
        </div>
      </div>

      <div className="admin-content">
        <SeoForm initialData={settings} token={token} />
      </div>
    </>
  );
}
