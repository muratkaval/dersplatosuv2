import { PageContainer } from "@/app/components/site-layout";
import PageHero from "@/app/components/page-hero";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getAnalyses,
  analysisConfig,
  activeNetBranches,
  liveExamCombinations,
  NET_BRANCH_SHORT,
  toMediaUrl,
} from "@/app/lib/strapi";
import "./analiz.css";

export const metadata: Metadata = {
  title: "Analizler",
  description:
    "Deneme netlerini gir, sana en uygun çalışma programını anında öğren. Yayındaki deneme analizleri.",
};

export default async function AnalizListPage() {
  const all = await getAnalyses();
  const analyses = all.filter((a) => a.isActive !== false);

  return (
    <PageContainer>
      <PageHero
        pageKey="analiz"
        title="Deneme"
        highlight="Analizleri"
        subtitle="Netlerini gir, sana en uygun çalışma programını anında öğren."
      />

      <div className="container cd-container">
        {analyses.length === 0 ? (
          <div className="cd-result-empty" style={{ margin: "24px 0 70px" }}>
            <span className="ms">hourglass_empty</span>
            <p>Şu anda yayında olan bir deneme analizi yok. Çok yakında burada olacak.</p>
          </div>
        ) : (
          <div className="cd-analiz-grid">
            {analyses.map((a) => {
              const config = analysisConfig(a);
              const branches = activeNetBranches(config);
              const comboCount = liveExamCombinations(branches).length;
              const cover = toMediaUrl(a.banner?.url);
              return (
                <Link key={a.id} href={`/analiz/${a.slug}`} className="cd-analiz-card">
                  {cover && (
                    <span
                      className="cd-analiz-cover"
                      style={{ backgroundImage: `url(${cover})` }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="cd-analiz-body">
                    <strong className="cd-analiz-title">{a.title}</strong>
                    {a.description && <span className="cd-analiz-desc">{a.description}</span>}
                    <span className="cd-analiz-meta">
                      {branches.map((b) => (
                        <span key={b} className="cd-analiz-chip">
                          {NET_BRANCH_SHORT[b]} {config.thresholds[b]}
                        </span>
                      ))}
                      <span className="cd-analiz-chip cd-analiz-chip-soft">
                        {comboCount} rota
                      </span>
                    </span>
                    <span className="cd-analiz-cta">
                      Netini gir <span className="ms">arrow_forward</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
