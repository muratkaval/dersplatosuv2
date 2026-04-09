import { Metadata } from "next";
import { PageContainer } from "../components/site-layout";
import { getBooks, getSubjects } from "@/app/lib/strapi";
import SolutionsView from "./solutions-view";
import "./soru-cozumleri.css";
import "../kitaplar/kitaplar.css"; // Reuse some grid styles if needed

export const metadata: Metadata = {
  title: "Video Soru Çözümleri | Ders Platosu",
  description: "Ders Platosu kitaplarının detaylı video soru çözümleri. Takıldığın soruların cevaplarına uzman öğretmenlerden anında ulaş.",
};

export default async function VideoSoruCozumleriPage() {
  const [books, subjects] = await Promise.all([
    getBooks(false), // Fetch all books to filter for solutions
    getSubjects(),
  ]);

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow">Ders Platosu</div>
          <h1>Video <span>Soru Çözümleri</span></h1>
          <p>
            Anlamadığın soru kalmasın. Kitaplarımızdaki tüm soruların detaylı çözümlerine buradan uzman hocalardan ulaşın.
          </p>
        </div>
      </section>

      <SolutionsView books={books} subjects={subjects} />
    </PageContainer>
  );
}
