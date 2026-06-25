import { notFound } from "next/navigation";
import { PageContainer } from "@/app/components/site-layout";
import { getProgramBySlug, getPrograms, toMediaUrl, periodUnitWord, programDurationCount, programCategories, type Program } from "@/app/lib/strapi";
import Link from "next/link";
import WeekCard from "@/app/components/week-card";
import BookCard from "@/app/components/book-card";
import type { Metadata } from "next";

function netLabel(p: Program): string | null {
  const hasMin = typeof p.netMin === "number";
  const hasMax = typeof p.netMax === "number";
  if (!hasMin && !hasMax) return null;
  // open-ended upper bound (stored as null or a sentinel) -> "N+ net"
  if (hasMin && (!hasMax || (p.netMax as number) >= 9999)) return `${p.netMin}+ net`;
  if (hasMin && hasMax) return `${p.netMin}-${p.netMax} net`;
  return `${p.netMin ?? p.netMax} net`;
}

function youtubeEmbed(input?: string): string | null {
  if (!input) return null;
  const s = input.trim();
  const m = s.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  const id = m ? m[1] : /^[a-zA-Z0-9_-]{11}$/.test(s) ? s : null;
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export async function generateStaticParams() {
  const programs = await getPrograms();
  return programs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProgramBySlug(slug);
  if (!p) return {};
  return { title: p.title, description: p.description || p.title };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const pdf = toMediaUrl(program.downloadPdf?.url);
  const subjectNames = (program.subjects || [])
    .map((s: any) => s?.name)
    .filter(Boolean)
    .join(", ");
  const net = netLabel(program);
  const weeks = (program.weeks || [])
    .slice()
    .sort((a, b) => (a.weekNo || 0) - (b.weekNo || 0));
  const unitWord = periodUnitWord(program.periodType);
  const durationCount = programDurationCount(program);
  const videoUrl = youtubeEmbed(program.videoUrl);

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <h1>{program.title}</h1>
          {program.description && <p>{program.description}</p>}
        </div>
      </section>

      <div className="container program-detail" style={{ maxWidth: "1040px", paddingBottom: "80px", display: "flex", flexDirection: "column" }}>
        <div className="program-infocard prog-s2">
          <div className="program-stats">
            {programCategories(program).length > 0 && (
              <div className="pstat">
                <span className="pstat-icon ms">school</span>
                <span className="pstat-text">
                  <span className="pstat-label">Sınav</span>
                  <span className="pstat-value">{programCategories(program).join(" · ")}</span>
                </span>
              </div>
            )}
            <div className="pstat">
              <span className="pstat-icon ms">menu_book</span>
              <span className="pstat-text">
                <span className="pstat-label">Branş</span>
                <span className="pstat-value">{subjectNames || "Genel"}</span>
              </span>
            </div>
            {net && (
              <div className="pstat">
                <span className="pstat-icon ms">trending_up</span>
                <span className="pstat-text">
                  <span className="pstat-label">Net Aralığı</span>
                  <span className="pstat-value">{net}</span>
                </span>
              </div>
            )}
            {durationCount > 0 && (
              <div className="pstat">
                <span className="pstat-icon ms">calendar_month</span>
                <span className="pstat-text">
                  <span className="pstat-label">Süre</span>
                  <span className="pstat-value">{durationCount} {unitWord.toLowerCase()}</span>
                </span>
              </div>
            )}
          </div>
          {pdf && (
            <div className="program-infocard-actions">
              <a href={pdf} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <span className="ms">picture_as_pdf</span> Tüm Programı Aç
              </a>
            </div>
          )}
        </div>

        {videoUrl && (
          <div className="program-video prog-s3">
            <iframe
              src={videoUrl}
              title="Program tanıtım videosu"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="prog-s1">
        {weeks.length > 0 ? (
          <>

            <div className="weeks-list">
              {weeks.map((w, i) => (
                <WeekCard
                  key={i}
                  index={i}
                  weekNo={w.weekNo}
                  title={w.title}
                  img={toMediaUrl(w.scheduleImage?.url)}
                  pdf={toMediaUrl(w.pdf?.url)}
                  link={w.link}
                  unitWord={unitWord}
                />
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>
            Bu program için içerik henüz eklenmemiş.
          </p>
        )}
        </div>

        {(program.instructors || []).length > 0 && (
          <section className="program-instructors prog-s4">
            <h2 className="weeks-heading"><span className="ms">groups</span> Program Hocaları</h2>
            <div className="program-instructors-grid">
              {(program.instructors || []).map((inst: any) => {
                const photo = toMediaUrl(inst.photo?.url);
                const inner = (
                  <>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt={inst.name} className="pi-photo" />
                    ) : (
                      <span className="pi-photo pi-photo-empty ms">person</span>
                    )}
                    <span className="pi-name">{inst.name}</span>
                  </>
                );
                return inst.slug ? (
                  <Link key={inst.id} href={`/hoca/${inst.slug}`} className="pi-card">{inner}</Link>
                ) : (
                  <div key={inst.id} className="pi-card">{inner}</div>
                );
              })}
            </div>
          </section>
        )}

        {(program.books || []).length > 0 && (
          <section className="program-books prog-s5">
            <h2 className="weeks-heading"><span className="ms">menu_book</span> Kullanılacak Kitaplar</h2>
            <p className="program-books-sub">Bu program, aşağıdaki kaynak kitaplar üzerinden ilerler.</p>
            <div className="program-books-grid">
              {(program.books || []).map((book: any) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        )}

        <div className="prog-s6" style={{ marginTop: "50px" }}>
          <Link href="/programlar" className="btn-outline">
            ← Tüm programlar
          </Link>
        </div>
      </div>

      <style>{`
        /* ---- info bar (centered) ---- */
        .program-infocard{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:18px 34px;background:#fff;border:1px solid rgba(15,23,42,0.08);border-radius:20px;padding:22px 38px;box-shadow:0 12px 34px rgba(15,23,42,0.09);margin:-46px auto 44px;width:fit-content;max-width:100%;position:relative;z-index:3}
        .program-stats{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px 22px}
        .pstat{display:flex;align-items:center;gap:14px}
        .pstat-icon{flex-shrink:0;width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:29px;color:#2563eb;background:rgba(37,99,235,0.1)}
        .pstat-text{display:flex;flex-direction:column;line-height:1.25}
        .pstat-label{font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;font-weight:700}
        .pstat-value{font-size:1.22rem;font-weight:800;color:#0f172a}
        .program-infocard-actions{display:flex;gap:10px;flex-wrap:wrap}
        body[data-theme="dark"] .program-infocard{background:#0b1530;border-color:rgba(255,255,255,0.08);box-shadow:0 14px 38px rgba(0,0,0,0.5)}
        body[data-theme="dark"] .pstat-icon{color:#60a5fa;background:rgba(96,165,250,0.15)}
        body[data-theme="dark"] .pstat-label{color:#64748b}
        body[data-theme="dark"] .pstat-value{color:#f1f5f9}

        /* ---- heading ---- */
        .weeks-heading{display:flex;align-items:center;gap:10px;font-size:1.45rem;font-weight:800;margin:0 0 22px;color:#0f172a}
        .weeks-heading .ms{font-size:26px;color:#2563eb}
        .weeks-heading-count{margin-left:8px;font-size:0.82rem;font-weight:700;color:#2563eb;background:rgba(37,99,235,0.1);padding:4px 11px;border-radius:999px}
        body[data-theme="dark"] .weeks-heading{color:#f1f5f9}
        body[data-theme="dark"] .weeks-heading .ms{color:#60a5fa}
        body[data-theme="dark"] .weeks-heading-count{color:#93c5fd;background:rgba(96,165,250,0.16)}

        /* ---- week list (stacked, full width) ---- */
        .program-video{position:relative;aspect-ratio:16/9;border-radius:16px;overflow:hidden;margin:0;box-shadow:0 12px 34px rgba(15,23,42,0.12)}
        .program-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
        .weeks-list{display:flex;flex-direction:column;gap:16px}

        /* Program hocalari */
        .program-instructors{margin-top:32px;padding-top:36px;border-top:1px solid rgba(148,163,184,0.18)}
        .program-instructors .weeks-heading{margin-bottom:22px}
        .program-instructors-grid{display:flex;flex-wrap:wrap;gap:20px}
        .pi-card{display:flex;flex-direction:column;align-items:center;gap:10px;width:104px;text-decoration:none;color:inherit}
        .pi-photo{width:84px;height:84px;border-radius:50%;object-fit:cover;border:2px solid rgba(37,99,235,0.25);background:#0f172a}
        .ms.pi-photo-empty{display:flex;align-items:center;justify-content:center;font-size:42px;color:#94a3b8}
        .pi-name{font-size:0.92rem;font-weight:700;text-align:center;color:#0f172a;line-height:1.3}
        .pi-card:hover .pi-photo{border-color:#2563eb}
        body[data-theme="dark"] .pi-name{color:#f1f5f9}
        body[data-theme="dark"] .pi-photo{border-color:rgba(96,165,250,0.3)}
        body[data-theme="dark"] .pi-card:hover .pi-photo{border-color:#60a5fa}

        /* Bu programda kullanilacak kitaplar */
        .program-books{margin-top:32px;padding-top:36px;border-top:1px solid rgba(148,163,184,0.18)}
        .program-books .weeks-heading{margin-bottom:6px}
        .program-books-sub{color:#64748b;font-size:0.98rem;margin:0 0 22px}
        body[data-theme="dark"] .program-books-sub{color:#94a3b8}
        .program-books-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:22px}
        .program-books-grid .book-card-premium{max-width:240px;margin:0 auto;width:100%}
        @media (max-width:640px){.program-books-grid{grid-template-columns:repeat(2,1fr);gap:14px}}
        .week-card{position:relative;background:#fff;border:1px solid rgba(15,23,42,0.08);border-radius:18px;box-shadow:0 4px 16px rgba(15,23,42,0.05);overflow:hidden;transition:box-shadow .2s ease,border-color .2s ease}
        .week-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#3b82f6,#2563eb)}
        .week-card.open{border-color:rgba(59,130,246,0.5);box-shadow:0 12px 32px rgba(37,99,235,0.14)}

        .week-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:16px 20px 16px 24px}
        .week-head-left{display:flex;align-items:center;gap:13px;min-width:0}
        .week-badge{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;background:rgba(37,99,235,0.12);color:#2563eb;font-weight:700;font-size:1.05rem}
        body[data-theme="dark"] .week-badge{background:rgba(96,165,250,0.16);color:#93c5fd}
        .week-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .week-empty{color:#64748b;font-size:0.9rem}

        /* ---- inline preview (opens downward, full width) ---- */
        .week-preview{display:grid;grid-template-rows:0fr;transition:grid-template-rows .32s ease}
        .week-card.open .week-preview{grid-template-rows:1fr}
        .week-preview-inner{overflow:hidden}
        .week-preview-pad{padding:2px 18px 18px}
        .week-preview-img{width:100%;height:auto;display:block;border-radius:12px;border:1px solid rgba(15,23,42,0.08)}
        .week-preview-pdf{display:flex;flex-direction:column;gap:12px}
        .week-preview-pdf iframe{width:100%;height:74vh;border:0;border-radius:12px;background:#fff}
        .week-preview-open{align-self:flex-start}
        /* Mobil: iframe yerine temiz belge karti (tarayici PDF'i iframe'de gostermez) */
        .week-preview-doc{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;padding:32px 18px;border-radius:12px;background:rgba(37,99,235,0.05);border:1px dashed rgba(37,99,235,0.3)}
        .week-preview-doc .btn-primary{align-self:stretch;justify-content:center}
        .ms.week-preview-doc-icon{font-size:54px;color:#2563eb}
        .week-preview-doc-hint{margin:0;font-size:0.92rem;color:#64748b;max-width:320px;line-height:1.5}
        body[data-theme="dark"] .week-preview-doc{background:rgba(96,165,250,0.08);border-color:rgba(96,165,250,0.35)}
        body[data-theme="dark"] .ms.week-preview-doc-icon{color:#60a5fa}
        body[data-theme="dark"] .week-preview-doc-hint{color:#94a3b8}

        /* ---- buttons (content-width, flex) ---- */
        .program-detail .btn-primary,.program-detail .btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:11px 18px;border-radius:12px;font-weight:700;font-size:0.92rem;line-height:1;white-space:nowrap;cursor:pointer;text-decoration:none;border:1.5px solid transparent;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
        .program-detail .btn-primary{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;box-shadow:0 6px 16px rgba(37,99,235,0.28)}
        .program-detail .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(37,99,235,0.4)}
        .program-detail .btn-outline{background:transparent;color:#2563eb;border-color:rgba(37,99,235,0.4)}
        .program-detail .btn-outline:hover{background:rgba(37,99,235,0.08);border-color:#2563eb}
        .program-detail .btn-primary .ms,.program-detail .btn-outline .ms{font-size:18px}

        /* ---- PDF İndir butonu base ---- */
        .program-detail .btn-danger {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          text-decoration: none;
          background: linear-gradient(135deg,#ef4444,#c41a1a);
          color: #fff;
          border: none;
          animation: pdf-glow 2s ease-in-out infinite;
          transition: transform .15s ease;
        }
        .program-detail .btn-danger:hover{transform:translateY(-2px) scale(1.02)}

        /* ---- week actions buttons (Önizle & Programı İndir) matching size & typography ---- */
        .program-detail .week-actions .btn-outline,
        .program-detail .week-actions .btn-danger {
          border-radius: 14px;
          font-weight: 800;
          line-height: 1;
        }

        /* Desktop matching sizes */
        @media (min-width:641px){
          .prog-s2{order:1} /* infocard */
          .prog-s1{order:2;margin-top:8px} /* haftalık program */
          .prog-s3{order:3;margin-top:32px} /* video — boşlukla aşağıda */
          .prog-s4{order:4}
          .prog-s5{order:5}
          .prog-s6{order:6}

          .program-detail .week-actions .btn-outline,
          .program-detail .week-actions .btn-danger {
            padding: 14px 28px !important;
            font-size: 1.05rem !important;
            font-weight: 800 !important;
            border-radius: 14px !important;
          }
          .program-detail .week-actions .btn-outline .ms,
          .program-detail .week-actions .btn-danger .ms {
            font-size: 22px !important;
          }
        }

        /* Mobile matching sizes */
        @media (max-width:640px){
          .program-detail .week-actions .btn-outline {
            padding: 14px 20px !important;
            font-size: 0.98rem !important;
            font-weight: 700 !important;
            border-radius: 12px !important;
          }
          .program-detail .week-actions .btn-outline .ms {
            font-size: 20px !important;
          }
          .program-detail .week-actions .btn-danger {
            padding: 34px 20px !important;
            font-size: 1.2rem !important;
            font-weight: 800 !important;
            border-radius: 14px !important;
          }
          .program-detail .week-actions .btn-danger .ms {
            font-size: 24px !important;
          }
        }
        /* Üzerinden geçen parlak ışık hüzmesi */
        .program-detail .btn-danger::after{
          content:"";
          position:absolute;
          top:0;left:-80%;
          width:60%;height:100%;
          background:linear-gradient(
            to right,
            transparent 0%,
            rgba(255,255,255,0.45) 50%,
            transparent 100%
          );
          transform:skewX(-20deg);
          animation:pdf-shine 2.2s ease-in-out infinite;
        }
        @keyframes pdf-shine{
          0%{left:-80%}
          55%,100%{left:130%}
        }
        @keyframes pdf-glow{
          0%,100%{box-shadow:0 4px 14px rgba(220,38,38,0.5),0 0 0 0 rgba(239,68,68,0)}
          50%{box-shadow:0 6px 22px rgba(220,38,38,0.75),0 0 0 5px rgba(239,68,68,0.15)}
        }
        .program-detail .btn-danger:hover{transform:translateY(-2px) scale(1.02)}
        .program-detail .btn-danger .ms{font-size:18px}

        /* ---- dark ---- */
        body[data-theme="dark"] .week-card{background:#0b1530;border-color:rgba(255,255,255,0.08);box-shadow:0 6px 22px rgba(0,0,0,0.4)}
        body[data-theme="dark"] .week-card.open{border-color:rgba(96,165,250,0.5)}
        body[data-theme="dark"] .week-empty{color:#94a3b8}
        body[data-theme="dark"] .week-preview-img{border-color:rgba(255,255,255,0.1)}
        body[data-theme="dark"] .program-detail .btn-outline{color:#93c5fd;border-color:rgba(147,197,253,0.4)}
        body[data-theme="dark"] .program-detail .btn-outline:hover{background:rgba(147,197,253,0.12);border-color:#93c5fd}

        /* ---- mobile ---- */
        @media (max-width:640px){
          .program-detail.container{padding-left:12px !important;padding-right:12px !important}
          .program-infocard{margin-top:0;padding:18px;gap:14px 16px;width:auto}
          .program-stats{gap:14px 16px}
          .pstat{flex:1 1 42%}
          .program-infocard-actions{width:100%}
          .program-infocard-actions>*{flex:1}
          .week-head{flex-direction:column;align-items:stretch;gap:12px;padding:14px 16px}
          .week-head-left{width:100%}
          .week-badge{width:100%;justify-content:center;padding:12px;font-size:1.1rem}
          .week-actions{width:100%}
          .week-actions>*{flex:1 1 0}
          .week-preview-pad{padding:2px 12px 14px}
          .week-preview-pdf iframe{height:64vh}
          /* Mobilde PDF butonu tam genişlik + büyük */
          .program-detail .btn-danger{width:100%;padding:28px 20px;font-size:1.2rem;font-weight:800;border-radius:14px}
          .program-detail .btn-danger .ms{font-size:24px}
          /* Mobil sıra: Haftalık Program (indirme) önce, bilgi kartı sonra */
          .prog-s1{order:1;margin-top:12px}
          .prog-s2{order:2;margin-top:20px}
          .prog-s3{order:3}
          .prog-s4{order:4}
          .prog-s5{order:5}
          .prog-s6{order:6}
        }
      `}</style>
    </PageContainer>
  );
}
