import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import SayaclarTable from "./sayaclar-table";

export const metadata = { title: "Sayaçlar | Admin" };

export default async function SayaclarPage() {
  const token = await requireAdminToken();

  const d = await adminGet(
    "/countdowns?sort=createdAt:desc&pagination[pageSize]=100",
    token
  );

  const countdowns = (d.data?.data || []).map((item: any) => ({
    id: item.id,
    documentId: item.documentId || String(item.id),
    title: item.title,
    slug: item.slug,
    targetDate: item.targetDate,
    enabled: item.enabled,
    showOnHomepage: item.showOnHomepage,
  }));

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Dashboard
            </Link>
          </div>
          <h1><span className="ms">timer</span> Sayaçlar</h1>
          <p>Sınav geri sayım sayaçlarını buradan yönetebilirsiniz.</p>
        </div>
        <div className="topbar-actions">
          <Link href="/admin/sayaclar/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Yeni Sayaç
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <SayaclarTable initialCountdowns={countdowns} />
      </div>
    </>
  );
}
