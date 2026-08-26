import { PageContainer } from "@/app/components/site-layout";
import PageHero from "@/app/components/page-hero";
import { notFound } from "next/navigation";
import {
  getAnalysisBySlug,
  getAnalysisPrograms,
  analysisConfig,
  activeNetBranches,
  NET_BRANCH_LABELS,
  toMediaUrl,
} from "@/app/lib/strapi";
import NetMatcher, { type RouteProgram } from "../net-matcher";
import type { Metadata } from "next";
import "../analiz.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ analiz: string }>;
}): Promise<Metadata> {
  const { analiz } = await params;
  const a = await getAnalysisBySlug(analiz);
  if (!a) return {};
  return {
    title: a.title,
    description:
      a.description ||
      `${a.title} netlerini gir; matematik, Türkçe ve fen sonucuna göre sana en uygun çalışma programı anında belirlensin.`,
  };
}

const FEATURES = [
  { icon: "track_changes", title: "Kişiye Özel", desc: "Netlerine göre özel program" },
  { icon: "insights", title: "Üç Branş Analizi", desc: "Matematik, Türkçe ve Fen ayrı ayrı" },
  { icon: "trending_up", title: "Eksiklerini Kapat", desc: "Doğru çalışma planı ile hedefe ulaş" },
];

export default async function AnalizPage({
  params,
}: {
  params: Promise<{ analiz: string }>;
}) {
  const { analiz } = await params;

  const analysis = await getAnalysisBySlug(analiz);
  if (!analysis || analysis.isActive === false) notFound();

  const programs = await getAnalysisPrograms(analiz);

  // Ayarlar artık global değil, bu analizin kendi kaydından geliyor.
  const config = analysisConfig(analysis);
  const matchedBranches = activeNetBranches(config)
    .map((b) => NET_BRANCH_LABELS[b])
    .join(", ");

  // Başlık altındaki tam genişlik banner. Görsel yatayda tekrarlanarak
  // ekranı boydan boya kaplar. Her analizin kendi banner'ı var.
  const bannerImage = toMediaUrl(analysis.banner?.url);
  const showBanner = config.bannerEnabled && !!bannerImage;

  // Client'a tam Program nesnesi geçmiyoruz: haftalar, kitaplar ve hocalar
  // bu sayfada kullanılmıyor, sadece bundle'ı şişirirdi.
  const routes: RouteProgram[] = programs.map((p) => ({
    id: p.id,
    routeCode: p.routeCode,
    title: p.title,
    slug: p.slug,
    description: p.description || "",
    matLevel: p.matLevel,
    turkceLevel: p.turkceLevel,
    fenLevel: p.fenLevel,
    sosyalLevel: p.sosyalLevel,
    pdfUrl: toMediaUrl(p.downloadPdf?.url),
  }));

  return (
    <PageContainer>
      {/* Her analizin başlığı panelden ayrı ayrı düzenlenebilsin diye
          pageKey slug'a bağlı; girilmemişse analizin kendi adına düşer. */}
      <PageHero
        pageKey={`analiz-${analiz}`}
        title="Netlerine Özel"
        highlight="Programını Al!"
        subtitle={
          analysis.description ||
          `${analysis.title} sonuçlarını gir, sana özel çalışma programını hemen al.`
        }
      />

      {showBanner && (
        <div
          className="cd-banner"
          role="img"
          aria-label={`${analysis.title} duyurusu`}
          style={{ backgroundImage: `url(${bannerImage})` }}
        />
      )}

      <div className="container cd-container">
        <div className="cd-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="cd-feature">
              <span className="cd-feature-icon ms">{f.icon}</span>
              <span className="cd-feature-text">
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </span>
            </div>
          ))}
        </div>

        <NetMatcher routes={routes} config={config} analizSlug={analiz} />

        <div className="cd-notes">
          <div className="cd-note">
            <span className="cd-note-icon ms">event_available</span>
            <div>
              <h3>Ne Zaman Kullanılır?</h3>
              <p>Deneme sonuçları açıklandıktan sonraki gün programına ulaşabilirsin.</p>
            </div>
          </div>
          <div className="cd-note">
            <span className="cd-note-icon ms">info</span>
            <div>
              <h3>Önemli Bilgi</h3>
              <p>
                {config.sosyalEnabled
                  ? `Program ${matchedBranches} netlerine göre oluşturulur.`
                  : `Sosyal Bilimler neti programa dahil değildir. Program ${matchedBranches} netlerine göre oluşturulur.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
