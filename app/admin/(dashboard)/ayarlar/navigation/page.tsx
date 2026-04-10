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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Link href="/admin/ayarlar" className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>
              <span className="ms" style={{ fontSize: "18px" }}>arrow_back</span>
              Ayarlar
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
