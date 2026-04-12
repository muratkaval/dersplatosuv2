import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import NavFooterForm from "./nav-footer-form";

export const metadata = { title: "Header & Footer | Admin" };

export default async function NavFooterPage() {
  const token = await requireAdminToken();
  const d = await adminGet("/global-setting", token);
  const data = d.data?.data || {};

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/ayarlar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Geri
            </Link>
          </div>
          <h1><span className="ms">view_quilt</span> Header & Footer Düzenleme</h1>
          <p>Navigasyon linklerini ve footer sütunlarını sürükle-bırak ile düzenle</p>
        </div>
      </div>

      <div className="admin-content">
        <NavFooterForm initialData={data} />
      </div>
    </>
  );
}
