import { PageContainer } from "../components/site-layout";
import { getBooks, toMediaUrl } from "../lib/strapi";

export default async function KitaplarPage() {
  const books = await getBooks(false);

  return (
    <PageContainer>
      <section className="books-section" style={{ paddingTop: "120px" }}>
        <div className="container">
          <div className="section-header">
            <h1 className="section-title">Kitaplarimiz</h1>
          </div>
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
                      Satin Al
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
