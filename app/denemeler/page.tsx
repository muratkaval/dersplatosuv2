import { PageContainer } from "@/app/components/site-layout";
import PageHero from "@/app/components/page-hero";
import { getExams, toMediaUrl, type Exam } from "@/app/lib/strapi";
import Link from "next/link";
import type { Metadata } from "next";
import "./denemeler.css";

export const metadata: Metadata = {
  title: "Denemeler",
  description:
    "Ders Platosu deneme sınavları: tarihler, katılım koşulları ve sıkça sorulan sorular. Sınav sayfasından hemen kaydını oluştur.",
};

function youtubeId(input?: string): string | null {
  if (!input) return null;
  const s = input.trim();
  const m = s.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : /^[a-zA-Z0-9_-]{11}$/.test(s) ? s : null;
}

// Kartın kapağı: yüklenen görsel, yoksa video linkinden YouTube küçük resmi.
function examThumb(exam: Exam): string {
  const cover = toMediaUrl(exam.cover?.url);
  if (cover) return cover;
  const id = youtubeId(exam.videoUrl);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

function formatExamDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function DenemelerPage() {
  const exams = await getExams();

  return (
    <PageContainer>
      <PageHero
        pageKey="denemeler"
        title="Deneme"
        highlight="Sınavlarımız"
        subtitle="Yaklaşan deneme sınavlarını incele, detaylarını gör ve kaydını oluştur."
      />

      <div className="container" style={{ maxWidth: "1100px" }}>
        {exams.length === 0 ? (
          <div className="exam-empty">Şu anda yayında olan bir deneme sınavı yok.</div>
        ) : (
          <div className="exam-grid">
            {exams.map((exam) => {
              const thumb = examThumb(exam);
              const dateLabel = formatExamDate(exam.examDate);
              return (
                <Link key={exam.id} href={`/denemeler/${exam.slug}`} className="exam-card">
                  {thumb && (
                    <div className="exam-card-thumb">
                      <img src={thumb} alt={exam.title} />
                    </div>
                  )}
                  <div className="exam-card-body">
                    {dateLabel && <span className="exam-card-date">{dateLabel}</span>}
                    <span className="exam-card-title">{exam.title}</span>
                    {exam.subtitle && <span className="exam-card-subtitle">{exam.subtitle}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
