import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";

export const metadata = { title: "Sayfalar | Admin" };

export default async function SayfalarPage() {
  const token = await requireAdminToken();
  const d = await adminGet("/pages?sort=title:asc&pagination[pageSize]=100", token);
  const pages = d.data?.data || [];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Dashboard
            </Link>
          </div>
          <h1><span className="ms">description</span> Sayfalar</h1>
          <p>KVKK, Gizlilik Politikası, Kullanım Koşulları gibi sayfaları yönet</p>
        </div>
        <div className="topbar-actions">
          <Link href="/admin/sayfalar/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Yeni Sayfa
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <div className="info-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>{pages.length} Sayfa</th>
                <th>SLUG</th>
                <th>İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.title}</td>
                  <td>
                    <code style={{ fontSize: "0.8rem", color: "var(--primary)", background: "rgba(99,102,241,0.08)", padding: "3px 8px", borderRadius: "6px" }}>
                      {p.slug || p.documentId}
                    </code>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Link href={`/admin/sayfalar/${p.documentId || p.id}`} className="btn btn-ghost btn-icon" title="Düzenle">
                        <span className="ms">edit</span>
                      </Link>
                      <Link href={`/${p.slug}`} target="_blank" className="btn btn-ghost btn-icon" title="Görüntüle">
                        <span className="ms">open_in_new</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                    Henüz sayfa eklenmemiş.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
