import { notFound } from "next/navigation";
import { PageContainer } from "@/app/components/site-layout";
import { getExamBySlug, getExams, toMediaUrl } from "@/app/lib/strapi";
import FAQSection from "@/app/components/faq-section";
import DenemeCountdown from "@/app/components/deneme-countdown";
import Link from "next/link";
import type { Metadata } from "next";
import "../denemeler.css";

function youtubeEmbed(input?: string): string | null {
  if (!input) return null;
  const s = input.trim();
  const m = s.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  const id = m ? m[1] : /^[a-zA-Z0-9_-]{11}$/.test(s) ? s : null;
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

function formatExamDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Panelden "/kayit" gibi site içi ya da "https://..." harici link girilebilir.
function ExamButton({ text, link, variant }: { text: string; link: string; variant: "primary" | "secondary" }) {
  const className = `exam-btn exam-btn-${variant}`;
  if (link.startsWith("/")) {
    return <Link href={link} className={className}>{text}</Link>;
  }
  return (
    <a href={link} className={className} target="_blank" rel="noreferrer">
      {text}
    </a>
  );
}

export async function generateStaticParams() {
  const exams = await getExams();
  return exams.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) return {};
  return {
    title: exam.metaTitle || exam.title,
    description: exam.metaDescription || exam.subtitle || exam.title,
  };
}

export default async function DenemeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam || exam.enabled === false) notFound();

  // mediaType "image" ise videoyu hiç arama; "video" ise link boşsa görsele düş.
  const video = exam.mediaType === "image" ? null : youtubeEmbed(exam.videoUrl);
  const image = toMediaUrl(exam.cover?.url);
  const dateLabel = formatExamDate(exam.examDate);
  const faq = exam.faq || [];
  const hasButtons = Boolean((exam.btn1Text && exam.btn1Link) || (exam.btn2Text && exam.btn2Link));

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          {dateLabel && <div className="page-hero-eyebrow">{dateLabel}</div>}
          <h1>{exam.title}</h1>
          {exam.subtitle && <p>{exam.subtitle}</p>}

          {exam.examDate && <DenemeCountdown targetDate={exam.examDate} />}

          {hasButtons && (
            <div className="exam-actions">
              {exam.btn1Text && exam.btn1Link && (
                <ExamButton text={exam.btn1Text} link={exam.btn1Link} variant="primary" />
              )}
              {exam.btn2Text && exam.btn2Link && (
                <ExamButton text={exam.btn2Text} link={exam.btn2Link} variant="secondary" />
              )}
            </div>
          )}
        </div>
      </section>

      <div className="exam-wrap">
        {video ? (
          <div className="exam-media">
            <iframe
              src={video}
              title={`${exam.title} tanıtım videosu`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : image ? (
          <img className="exam-media-plain" src={image} alt={exam.title} />
        ) : null}

        {exam.description && <div className="exam-description">{exam.description}</div>}

        {faq.length > 0 && (
          <>
            <h2 className="exam-section-title">Sıkça Sorulan Sorular</h2>
            <FAQSection items={faq} />
          </>
        )}

        <div className="exam-bottom-space" />
      </div>
    </PageContainer>
  );
}
