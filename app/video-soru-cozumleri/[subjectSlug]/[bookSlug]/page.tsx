import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/app/components/site-layout";
import { getBookBySlug, getSubjectBySlug, getSolutionVideos, toMediaUrl, toAbsoluteMediaUrl } from "@/app/lib/strapi";
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
  const bookTitle = book?.title || "Kitap";
  const subjectName = subject?.name || "";
  const title = `${bookTitle} Video Çözümleri | Ders Platosu`;
  const description = `${bookTitle} kitabının tüm sorularının video çözümleri. ${subjectName} branşı ve daha fazlası ücretsiz Ders Platosu'nda.`;
  const coverUrl = book?.cover?.url ? toAbsoluteMediaUrl(book.cover.url) : undefined;
  
  const keywords = [
    bookTitle,
    `${bookTitle} çözümleri`,
    `${bookTitle} soru çözümü`,
    `${bookTitle} video çözümleri`,
    `${subjectName} soru çözümleri`,
    "TYT soru çözümleri",
    "AYT soru çözümleri",
    "Ders Platosu",
  ];

  return {
    title,
    description,
    keywords: keywords.filter(Boolean),
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com"}/video-soru-cozumleri/${subjectSlug}/${bookSlug}` },
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com"}/video-soru-cozumleri/${subjectSlug}/${bookSlug}`,
      images: coverUrl ? [{ url: coverUrl, width: 800, height: 1120, alt: bookTitle }] : [],
    },
    twitter: { card: "summary_large_image", title, description, images: coverUrl ? [coverUrl] : [] }
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";
  
  // JSON-LD: ItemList containing VideoObjects
  const videoElements = videos.filter((v: any) => v.youtubeUrl || v.youtube_id).map((video: any, index: number) => {
    // Extract video id manually if needed or fallback
    let ytid = video.youtube_id;
    if (!ytid && video.youtubeUrl) {
      const match = String(video.youtubeUrl).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
      if (match) ytid = match[1];
    }
    
    return {
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "VideoObject",
        "name": `${book.title} - ${video.title || `Soru ${index + 1}`}`,
        "description": `${book.title} kapsamındaki ${video.title || "soru"} detaylı video çözümü.`,
        "thumbnailUrl": ytid ? `https://img.youtube.com/vi/${ytid}/hqdefault.jpg` : (book.cover?.url ? toMediaUrl(book.cover.url) : undefined),
        "uploadDate": book.publishedAt || "2024-01-01T00:00:00Z",
        "embedUrl": ytid ? `https://www.youtube.com/embed/${ytid}` : undefined
      }
    };
  });

  const solutionListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": videoElements,
    "name": `${book.title} Video Çözümleri`,
    "description": `${book.title} kitabı için hazırlanmış ${videos.length} adet ücretsiz soru çözüm videosu.`,
    "url": `${siteUrl}/video-soru-cozumleri/${subjectSlug}/${bookSlug}`
  };

  return (
    <PageContainer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(solutionListJsonLd) }}
      />
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
