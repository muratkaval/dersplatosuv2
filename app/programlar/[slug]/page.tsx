import { notFound } from "next/navigation";
import { PageContainer } from "@/app/components/site-layout";
import { getProgramBySlug, getPrograms, toMediaUrl, type Program } from "@/app/lib/strapi";
import Link from "next/link";
import MediaPreview from "@/app/components/media-preview";
import type { Metadata } from "next";

function netLabel(p: Program): string | null {
  const hasMin = typeof p.netMin === "number";
  const hasMax = typeof p.netMax === "number";
  if (!hasMin && !hasMax) return null;
  if (hasMax && (p.netMax as number) >= 9999) return `${p.netMin}+ net`;
  if (hasMin && hasMax) return `${p.netMin}-${p.netMax} net`;
  return `${p.netMin ?? p.netMax} net`;
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
  const unitWord = program.periodType === "Günlük" ? "Gün" : program.periodType === "Aylık" ? "Ay" : "Hafta";

  return (
    <PageContainer>
      <section className="page-hero" style={{ padding: "60px 0 30px" }}>
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow">
            {program.examType || "Program"}
            {subjectNames ? ` · ${subjectNames}` : ""}
          </div>
          <h1>{program.title}</h1>
          {program.description && <p>{program.description}</p>}
        </div>
      </section>

      <div className="container" style={{ maxWidth: "900px", paddingBottom: "80px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          {program.examType && <span className="program-tag">{program.examType}</span>}
          <span className="program-tag">{subjectNames || "Genel"}</span>
          {net && <span className="program-tag">{net}</span>}
          {weeks.length > 0 && <span className="program-tag">{weeks.length} {unitWord.toLowerCase()}</span>}
          {pdf && (
            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              <MediaPreview url={pdf} type="pdf" label="İncele" />
              <a href={pdf} target="_blank" rel="noopener noreferrer" download className="btn-primary">PDF İndir</a>
            </div>
          )}
        </div>

        {weeks.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {weeks.map((w, i) => {
              const img = toMediaUrl(w.scheduleImage?.url);
              const wPdf = toMediaUrl(w.pdf?.url);
              const wLink = w.link;
              const hasAny = img || wPdf || wLink;
              return (
                <div key={i}>
                  <h2 style={{ fontSize: "1.3rem", marginBottom: "14px" }}>
                    {w.title || `${w.weekNo || i + 1}. ${unitWord}`}
                  </h2>
                  {img && (
                    <MediaPreview url={img} type="image">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={w.title || `${i + 1}. ${unitWord}`}
                        style={{ width: "100%", height: "auto", borderRadius: "12px", display: "block" }}
                      />
                    </MediaPreview>
                  )}
                  {wPdf && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: img ? "14px" : "0" }}>
                      <MediaPreview url={wPdf} type="pdf" label="İncele" />
                      <a href={wPdf} target="_blank" rel="noopener noreferrer" download className="btn-primary">PDF İndir</a>
                    </div>
                  )}
                  {wLink && (
                    <div style={{ marginTop: img ? "14px" : "0" }}>
                      <a href={wLink} target="_blank" rel="noopener noreferrer" className="btn-outline">İncele</a>
                    </div>
                  )}
                  {!hasAny && (
                    <div style={{ color: "var(--text-muted)" }}>Bu {unitWord.toLowerCase()} için içerik eklenmemiş.</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>
            Bu program için içerik henüz eklenmemiş.
          </p>
        )}

        <div style={{ marginTop: "50px" }}>
          <Link href="/programlar" className="btn-outline">
            ← Tüm programlar
          </Link>
        </div>
      </div>

      <style>{`
        .program-tag{font-size:0.82rem;padding:5px 12px;border-radius:6px;background:var(--bg-secondary,#f1f1f1);color:var(--text-muted,#666);white-space:nowrap}
      `}</style>
    </PageContainer>
  );
}
