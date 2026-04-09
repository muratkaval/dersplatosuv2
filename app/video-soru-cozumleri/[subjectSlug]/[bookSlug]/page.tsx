import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/app/components/site-layout";
import { getBookBySlug, getSubjectBySlug, getSolutionVideos, toMediaUrl } from "@/app/lib/strapi";
import VideoPlayerView from "./video-player-view";
import "../../soru-cozumleri.css";

interface Props {
  params: Promise<{ subjectSlug: string; bookSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookSlug, subjectSlug } = await params;
  const [book, subject] = await Promise.all([
    getBookBySlug(bookSlug),
    getSubjectBySlug(subjectSlug),
  ]);
  return {
    title: `${book?.title || "Kitap"} Video Çözümleri | Ders Platosu`,
    description: `${book?.title || ""} kitabının tüm sorularının video çözümleri. ${subject?.name || ""} branşı.`,
  };
}

export default async function BookSolutionsPage({ params }: Props) {
  const { subjectSlug, bookSlug } = await params;

  const [book, subject] = await Promise.all([
    getBookBySlug(bookSlug),
    getSubjectBySlug(subjectSlug),
  ]);

  if (!book || !subject) return notFound();

  const videos = await getSolutionVideos(book.documentId || book.id.toString());

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow" style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "30px" }}>
            <Link href="/video-soru-cozumleri" style={{ color: "inherit", textDecoration: "none" }}>
              Branşlar
            </Link>
            <span>›</span>
            <Link href={`/video-soru-cozumleri/${subjectSlug}`} style={{ color: "inherit", textDecoration: "none" }}>
              {subject.name}
            </Link>
          </div>
          
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ margin: 0, fontSize: "2.2rem", lineHeight: "1.2", fontWeight: 800 }}><span>{book.title}</span></h1>
          </div>
        </div>
      </section>

      <section style={{ padding: "60px 0" }}>
        <div className="container">
          <VideoPlayerView
            book={book}
            subject={subject}
            subjectSlug={subjectSlug}
            videos={videos}
          />
        </div>
      </section>
    </PageContainer>
  );
}
