import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet, STRAPI_UNREACHABLE_MESSAGE } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import RotaPanel, { type RouteRow } from "./rota-panel";
import { readLiveExamConfig, isLiveExamProgram, toMediaUrl, type NetLevel } from "@/app/lib/strapi";

// Strapi enum degeri; beklenmedik bir sey gelirse etiketsiz say.
const level = (v: unknown): NetLevel | undefined =>
  v === "alti" || v === "ustu" ? v : undefined;

export const metadata = { title: "Canlı Deneme | Admin" };

function TopbarTitle() {
  return (
    <div className="topbar-title">
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <Link
          href="/admin"
          style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}
        >
          <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Dashboard
        </Link>
      </div>
      <h1><span className="ms">track_changes</span> Canlı Deneme</h1>
      <p>Öğrencinin girdiği nete göre önerilecek programları yönetin.</p>
    </div>
  );
}

export default async function CanliDenemeAdminPage() {
  const token = await requireAdminToken();

  const [pr, gs] = await Promise.all([
    adminGet(
      "/programs?populate[downloadPdf]=true&sort=routeCode:asc&pagination[pageSize]=200",
      token
    ),
    adminGet("/global-setting?populate[liveExamImage]=true", token),
  ]);

  // Strapi kapalıysa panel çökmesin; başlık dursun, içerik uyarı göstersin.
  if (!pr.ok) {
    return (
      <>
        <div className="admin-topbar">
          <TopbarTitle />
        </div>
        <div className="admin-content">
          <div className="empty-state">
            <span className="ms">cloud_off</span>
            {pr.data?.error?.message || STRAPI_UNREACHABLE_MESSAGE}
          </div>
        </div>
      </>
    );
  }

  // Sadece rota programları bu ekrana girer; normal programlar hiç görünmez.
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

  const config = readLiveExamConfig(gs.data?.data?.liveExamConfig);

  // Kaydet butonu üst barda, Program Ekle ile yan yana durmalı; bu yüzden
  // üst barı panel (client) çiziyor, başlık kısmını buradan alıyor.
  return (
    <RotaPanel
      routes={routes}
      config={config}
      imageUrl={toMediaUrl(gs.data?.data?.liveExamImage?.url)}
      topbarTitle={<TopbarTitle />}
    />
  );
}
