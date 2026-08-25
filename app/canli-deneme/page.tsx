import { PageContainer } from "@/app/components/site-layout";
import PageHero from "@/app/components/page-hero";
import {
  getLiveExamPrograms,
  getGlobalSettings,
  readLiveExamConfig,
  activeNetBranches,
  liveExamCombinations,
  NET_BRANCH_LABELS,
  toMediaUrl,
} from "@/app/lib/strapi";
import NetMatcher, { type RouteProgram } from "./net-matcher";
import type { Metadata } from "next";
import "./canli-deneme.css";

export const metadata: Metadata = {
  title: "Canlı Deneme Programı",
  description:
    "Canlı deneme netlerini gir; matematik, Türkçe ve fen sonucuna göre sana en uygun çalışma programı anında belirlensin.",
};

export default async function CanliDenemePage() {
  const [programs, globalSettings] = await Promise.all([
    getLiveExamPrograms(),
    getGlobalSettings(),
  ]);

  const site = globalSettings?.attributes || globalSettings || {};
  const config = readLiveExamConfig(site.liveExamConfig);
  const comboCount = liveExamCombinations(activeNetBranches(config)).length;
  const matchedBranches = activeNetBranches(config)
    .map((b) => NET_BRANCH_LABELS[b])
    .join(", ");

  const features = [
    { icon: "track_changes", title: "Kişiye Özel", desc: "Netlerine göre özel program" },
    {
      icon: "insights",
      title: "Üç Branş Analizi",
      desc: "Matematik, Türkçe ve Fen ayrı ayrı",
    },
    { icon: "trending_up", title: "Eksiklerini Kapat", desc: "Doğru çalışma planı ile hedefe ulaş" },
  ];

  // Client'a tam Program nesnesi geçmiyoruz: haftalar, kitaplar ve hocalar
  // bu sayfada kullanılmıyor, sadece bundle'ı şişirirdi.
  // Baslik altindaki tam genislik banner. Gorsel yatayda tekrarlanarak
  // ekrani boydan boya kaplar. Panelden ayri bir anahtarla acilip kapanir.
  const bannerImage = toMediaUrl(site.liveExamImage?.url || site.liveExamImage);
  const showBanner = config.bannerEnabled && !!bannerImage;

  const featureStrip = (
    <div className="cd-features">
      {features.map((f) => (
        <div key={f.title} className="cd-feature">
          <span className="cd-feature-icon ms">{f.icon}</span>
          <span className="cd-feature-text">
            <strong>{f.title}</strong>
            <span>{f.desc}</span>
          </span>
        </div>
      ))}
    </div>
  );

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
      <PageHero
        pageKey="canli-deneme"
        title="Netlerine Özel"
        highlight="Programını Al!"
        subtitle="Canlı deneme sonuçlarını gir, sana özel çalışma programını hemen al."
      />

      {showBanner && (
        <div
          className="cd-banner"
          role="img"
          aria-label="Canlı deneme duyurusu"
          style={{ backgroundImage: `url(${bannerImage})` }}
        />
      )}

      <div className="container cd-container">
        {featureStrip}

        <NetMatcher routes={routes} config={config} />

        <div className="cd-notes">
          <div className="cd-note">
            <span className="cd-note-icon ms">event_available</span>
            <div>
              <h3>Ne Zaman Kullanılır?</h3>
              <p>Canlı deneme sonuçları açıklandıktan sonraki gün programına ulaşabilirsin.</p>
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
