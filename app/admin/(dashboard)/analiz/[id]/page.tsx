import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet, STRAPI_UNREACHABLE_MESSAGE } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnalizForm from "../analiz-form";
import RotaPanel, { type RouteRow } from "../rota-panel";
import { analysisConfig, isLiveExamProgram, type NetLevel } from "@/app/lib/strapi";

export const metadata = { title: "Analiz | Admin" };

// Strapi enum degeri; beklenmedik bir sey gelirse etiketsiz say.
const level = (v: unknown): NetLevel | undefined =>
  v === "alti" || v === "ustu" ? v : undefined;

export default async function AnalizDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await requireAdminToken();
  const { id } = await params;

  const an = await adminGet(`/analyses/${id}?populate[banner]=true`, token);
  if (!an.ok && an.status === 404) return notFound();
  const analysis = an.data?.data;

  const pr = await adminGet(
    `/programs?filters[analysis][documentId][$eq]=${id}&populate[downloadPdf]=true&sort=routeCode:asc&pagination[pageSize]=200`,
    token
  );

  const routes: RouteRow[] = (pr.data?.data || [])
    .map((p: any) => ({
      documentId: p.documentId || String(p.id),
      title: p.title || "(başlıksız)",
      slug: p.slug || "",
      routeCode: p.routeCode || "",
      matLevel: level(p.matLevel),
      turkceLevel: level(p.turkceLevel),
      fenLevel: level(p.fenLevel),
      sosyalLevel: level(p.sosyalLevel),
      hasVideo: !!p.videoUrl,
      hasPdf: !!p.downloadPdf,
    }))
    .filter(isLiveExamProgram);

  const config = analysisConfig(analysis);

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link
              href="/admin/analiz"
              style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}
            >
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Deneme Analizi
            </Link>
          </div>
          <h1><span className="ms">track_changes</span> {analysis?.title || "Analiz"}</h1>
          <p>Eşikleri düzenleyin ve her kombinasyona bir program atayın.</p>
        </div>
        <div className="topbar-actions">
          {analysis?.slug && (
            <Link href={`/analiz/${analysis.slug}`} target="_blank" className="btn btn-ghost">
              <span className="ms">open_in_new</span>
              Sayfayı Gör
            </Link>
          )}
          <Link href={`/admin/analiz/${id}/rota/yeni`} className="btn btn-primary">
            <span className="ms">add</span>
            Program Ekle
          </Link>
        </div>
      </div>

      <div className="admin-content">
        {!an.ok || !analysis ? (
          <div className="empty-state">
            <span className="ms">cloud_off</span>
            {an.data?.error?.message || STRAPI_UNREACHABLE_MESSAGE}
          </div>
        ) : (
          <>
            <AnalizForm analysis={analysis} />
            <RotaPanel routes={routes} config={config} analizId={id} />
          </>
        )}
      </div>
    </>
  );
}
