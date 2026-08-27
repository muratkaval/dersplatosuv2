import { PageContainer } from "@/app/components/site-layout";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getAnalysisBySlug,
  getAnalysisProgramBySlug,
  analysisConfig,
  programNetLevels,
  netLevelWord,
  activeNetBranches,
  NET_BRANCH_SHORT,
  toMediaUrl,
  type NetBranch,
} from "@/app/lib/strapi";
import BookCard from "@/app/components/book-card";
import PdfOnizleme from "../../pdf-onizleme";
import "../../analiz.css";

const TONES: Record<NetBranch, string> = {
  mat: "blue",
  turkce: "orange",
  fen: "green",
  sosyal: "purple",
};

function youtubeEmbed(input?: string): string | null {
  if (!input) return null;
  const s = input.trim();
  const m = s.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  const id = m ? m[1] : /^[a-zA-Z0-9_-]{11}$/.test(s) ? s : null;
  return id ? `https://www.youtube.com/embed/${id}` : null;
}



export async function generateMetadata({
  params,
}: {
  params: Promise<{ analiz: string; rota: string }>;
}): Promise<Metadata> {
  const { analiz, rota } = await params;
  const program = await getAnalysisProgramBySlug(analiz, rota);
  if (!program) return {};
  return {
    title: program.routeCode ? `Rota ${program.routeCode} — ${program.title}` : program.title,
    description:
      program.description ||
      "Deneme netlerine göre sana özel belirlenen çalışma programı.",
  };
}

export default async function RotaDetayPage({
  params,
}: {
  params: Promise<{ analiz: string; rota: string }>;
}) {
  const { analiz, rota } = await params;
  const [analysis, program] = await Promise.all([
    getAnalysisBySlug(analiz),
    getAnalysisProgramBySlug(analiz, rota),
  ]);
  if (!analysis || !program) notFound();

  const config = analysisConfig(analysis);
  const branches = activeNetBranches(config);
  const levels = programNetLevels(program);
  const embed = youtubeEmbed(program.videoUrl);
  const pdf = toMediaUrl(program.downloadPdf?.url);

  return (
    <PageContainer>
      <div className="container cd-container">
        <section className="cd-detail-hero">
          <Link href={`/analiz/${analiz}`} className="cd-detail-back">
            <span className="ms">arrow_back</span> Netini tekrar gir
          </Link>

          {program.routeCode && <span className="cd-detail-code">Rota {program.routeCode}</span>}
          <h1 className="cd-detail-title">{program.title}</h1>

          {levels && (
            <div className="cd-badges cd-detail-badges">
              {branches.map((b) => (
                <span key={b} className={`cd-badge cd-tone-${TONES[b]}`}>
                  {NET_BRANCH_SHORT[b]}: {config.thresholds[b]} {netLevelWord(levels[b])}
                </span>
              ))}
            </div>
          )}

          {program.description && <p className="cd-detail-desc">{program.description}</p>}
        </section>

        {embed && (
          <div className="cd-detail-video">
            <iframe
              src={embed}
              title={`${program.title} tanıtım videosu`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {pdf && <PdfOnizleme url={pdf} title={program.title} />}

        {!embed && !pdf && (
          <div className="cd-result-empty" style={{ margin: "0 0 40px" }}>
            <span className="ms">hourglass_empty</span>
            <p>Bu rotanın içeriği henüz yüklenmedi. Çok yakında burada olacak.</p>
          </div>
        )}

        {/* Programlar detay sayfasindaki ile ayni iki bolum: hocalar ve kitaplar.
           Iliskiler zaten program kaydinda var, panelden secilir. */}
        {(program.instructors || []).length > 0 && (
          <section className="cd-detail-block">
            <h2 className="cd-detail-heading">
              <span className="ms">groups</span> Program Hocaları
            </h2>
            <div className="cd-instructors">
              {(program.instructors || []).map((inst: any) => {
                const photo = toMediaUrl(inst.photo?.url);
                const inner = (
                  <>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt={inst.name} className="cd-pi-photo" />
                    ) : (
                      <span className="cd-pi-photo cd-pi-photo-empty ms">person</span>
                    )}
                    <span className="cd-pi-name">{inst.name}</span>
                  </>
                );
                return inst.slug ? (
                  <Link key={inst.id} href={`/hoca/${inst.slug}`} className="cd-pi-card">
                    {inner}
                  </Link>
                ) : (
                  <div key={inst.id} className="cd-pi-card">
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {(program.books || []).length > 0 && (
          <section className="cd-detail-block">
            <h2 className="cd-detail-heading">
              <span className="ms">menu_book</span> Kullanılacak Kitaplar
            </h2>
            <p className="cd-detail-sub">Bu program, aşağıdaki kaynak kitaplar üzerinden ilerler.</p>
            <div className="cd-books">
              {(program.books || []).map((book: any) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
