import { PageContainer } from "../components/site-layout";
import { getBooks, toMediaUrl } from "../lib/strapi";

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
          <div className="books-grid">
            {books.map((book) => (
              <article key={book.id} className="book-item">
                <div className="book-cover-wrap">
                  <img src={toMediaUrl(book.cover?.url || "")} alt={book.title} />
                </div>
                <div className="book-details">
                  <h4>{book.title}</h4>
                  {book.buy_link ? (
                    <a className="btn-buy-book" href={book.buy_link} target="_blank" rel="noopener noreferrer">
                      Satın Al
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
