import { PageContainer } from "@/app/components/site-layout";
import BookCard from "@/app/components/book-card";
import ProgramFilter from "@/app/components/program-filter";
import { getPrograms, getBooks, getGlobalSettings } from "@/app/lib/strapi";
import PageHero from "@/app/components/page-hero";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programlar",
  description:
    "TYT ve AYT için net aralığına ve branşa göre filtreleyebileceğin haftalık çalışma programları. Sana uygun programı seç ve indir.",
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

export default async function ProgramlarPage() {
  const [programs, featuredBooks, globalSettings] = await Promise.all([
    getPrograms(),
    getBooks(true),
    getGlobalSettings(),
  ]);

  const site = globalSettings?.attributes || globalSettings || {};
  const videoUrl = youtubeEmbed(site.programsPageVideo);

  return (
    <PageContainer>
      <PageHero pageKey="programlar" title="Ders Platosu" highlight="Programları" subtitle="Sınavını ve net aralığını seç, sana uygun çalışma programını indir." />

      <div className="container" style={{ maxWidth: "1100px" }}>
        {videoUrl && (
          <div
            style={{
              position: "relative",
              aspectRatio: "16 / 9",
              borderRadius: "16px",
              overflow: "hidden",
              margin: "0 0 50px",
            }}
          >
            <iframe
              src={videoUrl}
              title="Programlar tanıtım videosu"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <section style={{ paddingBottom: "60px" }}>
          <ProgramFilter programs={programs} netBuckets={site.programNets || []} examOptions={site.programExams || []} />
        </section>
      </div>

      <section className="books-section" id="kitaplar">
        <div className="container">
          <div className="section-header category-header">
            <h2 className="section-title category-title">
              <span className="category-title-bar"></span>
              <span className="category-title-text">{site.booksTitle || "Kitaplarımız"}</span>
            </h2>
            <Link href="/kitaplar" className="section-link category-link">
              Tümünü Gör ›
            </Link>
          </div>
          <div className="books-grid-unified">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
