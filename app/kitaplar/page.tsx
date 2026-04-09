import { PageContainer } from "../components/site-layout";
import BookCard from "../components/book-card";
import { getBooks } from "../lib/strapi";

export default async function KitaplarPage() {
  const books = await getBooks(false);

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow">Ders Platosu</div>
          <h1>Popüler <span>Kitaplarımız</span></h1>
          <p>En güncel ve yeni nesil soru bankalarıyla sınavlara bir adım önde hazırlanın.</p>
        </div>
      </section>

      <section className="books-section" style={{ padding: "60px 0" }}>
        <div className="container">
          <div className="books-grid-unified">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
