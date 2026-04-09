import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/app/components/site-layout";
import { getBooks, getSubjectBySlug, toMediaUrl } from "@/app/lib/strapi";
import "../../kitaplar/kitaplar.css";
import "../soru-cozumleri.css";

interface Props {
  params: Promise<{ subjectSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  return {
    title: `${subject?.name || "Branş"} Soru Çözümleri | Ders Platosu`,
    description: `${subject?.name || ""} branşına ait kitapların video soru çözümleri.`,
  };
}

export default async function SubjectSolutionsPage({ params }: Props) {
  const { subjectSlug } = await params;
  const [subject, books] = await Promise.all([
    getSubjectBySlug(subjectSlug),
    getBooks(false),
  ]);

  if (!subject) return notFound();

  const filteredBooks = books.filter((b: any) => {
    const bSubs = Array.isArray(b.subjects) ? b.subjects : (b.subjects?.data || []);
    return bSubs.some((bs: any) => bs.id === subject.id);
  });

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow">
            <Link href="/video-soru-cozumleri" style={{ color: "inherit", textDecoration: "none" }}>
              ← Tüm Branşlar
            </Link>
          </div>
          <h1>{subject.name} <span>Kitapları</span></h1>
          <p>Bir kitap seçin ve video çözümlerine anında ulaşın.</p>
        </div>
      </section>

      <section style={{ padding: "60px 0" }}>
        <div className="container">
          <div className="books-grid">
            {filteredBooks.map((book: any) => (
              <Link
                key={book.id}
                href={`/video-soru-cozumleri/${subjectSlug}/${book.slug}`}
                className="book-item"
                style={{ textDecoration: "none", cursor: "pointer" }}
              >
                <div className="book-cover-wrap">
                  <img
                    src={toMediaUrl(book.cover?.url || "") || "https://via.placeholder.com/200x280?text=Kitap"}
                    alt={book.title}
                  />
                  <div className="solution-badge">VİDEO ÇÖZÜMLÜ</div>
                </div>
                <div className="book-details">
                  <h4>{book.title}</h4>
                  <div className="btn-solution">Video Çözümlerini İzle</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
