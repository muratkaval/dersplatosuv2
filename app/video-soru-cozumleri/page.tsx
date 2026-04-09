import { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "../components/site-layout";
import { getBooks, getSubjects } from "@/app/lib/strapi";
import "./soru-cozumleri.css";

export const metadata: Metadata = {
  title: "Video Soru Çözümleri | Ders Platosu",
  description: "Ders Platosu kitaplarının detaylı video soru çözümleri. Takıldığın soruların cevaplarına uzman öğretmenlerden anında ulaş.",
};

export default async function VideoSoruCozumleriPage() {
  const [books, subjects] = await Promise.all([
    getBooks(false),
    getSubjects(),
  ]);

  // Sadece kitabı olan branşları göster
  const categories = subjects.filter((s: any) =>
    books.some((b: any) => {
      const bSubs = Array.isArray(b.subjects) ? b.subjects : (b.subjects?.data || []);
      return bSubs.some((bs: any) => bs.id === s.id);
    })
  );

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow">Ders Platosu</div>
          <h1>Video <span>Soru Çözümleri</span></h1>
          <p>Anlamadığın soru kalmasın. Branşını seç, kitabını bul, videoyu izle.</p>
        </div>
      </section>

      <section style={{ padding: "60px 0" }}>
        <div className="container">
          <div className="category-grid">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/video-soru-cozumleri/${cat.slug}`}
                className="category-card"
                style={{ textDecoration: "none" }}
              >
                <h3>{cat.name}</h3>
                <p>Kitapları Görüntüle</p>
                <div className="category-arrow">→</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
