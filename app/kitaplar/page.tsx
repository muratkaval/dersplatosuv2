import { PageContainer } from "../components/site-layout";
import { getBooks, getSubjects } from "../lib/strapi";
import BookFilterableList from "../components/book-filterable-list";
import PageHero from "@/app/components/page-hero";

export default async function KitaplarPage() {
  const [books, subjects] = await Promise.all([
    getBooks(false),
    getSubjects()
  ]);

  return (
    <PageContainer>
      <PageHero pageKey="kitaplar" title="Ders Platosu" highlight="Kitapları" subtitle="Ders Platosu hocaları ve yayınlar ile özel olarak hazırlanmış kitaplar" />

      <section className="books-section" style={{ padding: "40px 0 80px" }}>
        <div className="container">
          <BookFilterableList initialBooks={books} subjects={subjects} />
        </div>
      </section>
    </PageContainer>
  );
}
