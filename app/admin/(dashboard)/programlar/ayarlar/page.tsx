import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import ProgramSettingsForm from "./settings-form";

export const metadata = { title: "Program Ayarları | Admin" };

export default async function ProgramAyarlarPage() {
  const token = await requireAdminToken();

  const [gs, s] = await Promise.all([
    adminGet("/global-setting", token),
    adminGet("/subjects?sort=name:asc&pagination[pageSize]=100", token),
  ]);

  const settings = gs.data?.data || {};
  const subjects = (s.data?.data || []).map((x: any) => ({
    id: x.id,
    documentId: x.documentId || String(x.id),
    name: x.name,
  }));

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/programlar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Programlara Dön
            </Link>
          </div>
          <h1><span className="ms">tune</span> Program Ayarları</h1>
          <p>Üst tanıtım videosu, filtre kategorileri ve dersleri buradan yönetin.</p>
        </div>
      </div>

      <div className="admin-content">
        <ProgramSettingsForm
          initialVideo={settings.programsPageVideo || ""}
          initialCategories={settings.programCategoryOptions || []}
          initialSubjects={subjects}
        />
      </div>
    </>
  );
}
