import { PageContainer } from "../components/site-layout";
import { getBooks, getSubjects } from "../lib/strapi";
import BookFilterableList from "../components/book-filterable-list";

export default async function KitaplarPage() {
  const [books, subjects] = await Promise.all([
    getBooks(false),
    getSubjects()
  ]);

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow">Ders Platosu</div>
          <h1>Ders Platosu <span>Kitapları</span></h1>
          <p>Ders Platosu hocaları ve yayınlar ile özel olarak hazırlanmışkitaplar</p>
        </div>
      </section>

      <section className="books-section" style={{ padding: "40px 0 80px" }}>
        <div className="container">
          <BookFilterableList initialBooks={books} subjects={subjects} />
        </div>
      </section>
    </PageContainer>
  );
}
