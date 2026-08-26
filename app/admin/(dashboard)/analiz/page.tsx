import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet, STRAPI_UNREACHABLE_MESSAGE } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import { isLiveExamProgram } from "@/app/lib/strapi";

export const metadata = { title: "Deneme Analizi | Admin" };

export default async function AnalizlerPage() {
  const token = await requireAdminToken();

  const [an, pr] = await Promise.all([
    adminGet("/analyses?populate[banner]=true&sort=displayOrder:asc&pagination[pageSize]=100", token),
    adminGet("/programs?populate[analysis]=true&pagination[pageSize]=200", token),
  ]);

  const programs = (pr.data?.data || []).filter(isLiveExamProgram);

  const analyses = (an.data?.data || []).map((a: any) => {
    const bagli = programs.filter((p: any) => p.analysis?.documentId === a.documentId);
    const gerekli = a.sosyalEnabled ? 16 : 8;
    // Aynı kombinasyon iki programa verilmiş olabilir; benzersiz sayıyoruz.
    const kombinasyonlar = new Set(
      bagli.map((p: any) =>
        [p.matLevel, p.turkceLevel, p.fenLevel, a.sosyalEnabled ? p.sosyalLevel : ""].join("|")
      )
    );
    return {
      documentId: a.documentId || String(a.id),
      title: a.title || "(başlıksız)",
      slug: a.slug || "",
      isActive: a.isActive !== false,
      dolu: kombinasyonlar.size,
      gerekli,
    };
  });

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link
              href="/admin"
              style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}
            >
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Dashboard
            </Link>
          </div>
          <h1><span className="ms">track_changes</span> Deneme Analizi</h1>
          <p>Her deneme için net eşiklerini ve önerilecek programları yönetin.</p>
        </div>
        <div className="topbar-actions">
          <Link href="/analiz" target="_blank" className="btn btn-ghost">
            <span className="ms">open_in_new</span>
            Sayfayı Gör
          </Link>
          <Link href="/admin/analiz/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Yeni Analiz
          </Link>
        </div>
      </div>

      <div className="admin-content">
        {!an.ok ? (
          <div className="empty-state">
            <span className="ms">cloud_off</span>
            {an.data?.error?.message || STRAPI_UNREACHABLE_MESSAGE}
          </div>
        ) : analyses.length === 0 ? (
          <div className="empty-state">
            <span className="ms">track_changes</span>
            Henüz deneme analizi yok. &quot;Yeni Analiz&quot; ile bir deneme oluşturun.
          </div>
        ) : (
          <div className="table-card">
            <div className="table-header">
              <h3>{analyses.length} Analiz</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Başlık / Slug</th>
                  <th style={{ width: "150px" }}>Kapsama</th>
                  <th style={{ width: "110px" }}>Durum</th>
                  <th style={{ width: "110px" }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a: any) => {
                  const tam = a.dolu >= a.gerekli;
                  return (
                    <tr key={a.documentId}>
                      <td>
                        <strong style={{ color: "#e2e8f0" }}>{a.title}</strong>
                        <br />
                        <small style={{ color: "#475569" }}>/analiz/{a.slug}</small>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: tam ? "rgba(34,197,94,0.16)" : "rgba(133,77,14,0.25)",
                            color: tam ? "#4ade80" : "#fde68a",
                          }}
                        >
                          {a.dolu} / {a.gerekli} dolu
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: a.isActive ? "rgba(59,130,246,0.16)" : "#334155",
                            color: a.isActive ? "#60a5fa" : "#94a3b8",
                          }}
                        >
                          {a.isActive ? "Yayında" : "Taslak"}
                        </span>
                      </td>
                      <td>
                        <div className="td-actions">
                          <Link href={`/admin/analiz/${a.documentId}`} className="btn btn-ghost btn-sm">
                            <span className="ms">edit</span> Aç
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
