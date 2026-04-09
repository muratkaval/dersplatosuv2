import Link from "next/link";
import { toMediaUrl } from "@/app/lib/strapi";

interface BookCardProps {
  book: any;
}

export default function BookCard({ book }: BookCardProps) {
  // Deep Search for URL (Handles Strapi v4, v5, and flattened structures)
  const findUrl = (obj: any): string | null => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj.url && typeof obj.url === 'string') return obj.url;
    if (obj.data) return findUrl(obj.data);
    if (obj.attributes) return findUrl(obj.attributes);
    if (obj.formats?.small?.url) return obj.formats.small.url;
    if (obj.formats?.thumbnail?.url) return obj.formats.thumbnail.url;
    return null;
  };

  const rawUrl = findUrl(book.cover);
  const bookCover = toMediaUrl(rawUrl);
  
  return (
    <div className="book-card-premium">
      <div className="book-card-cover-wrap">
        <img 
          src={bookCover || 'https://via.placeholder.com/400x560?text=Kitap'} 
          alt={book.title} 
          className="book-card-cover"
          loading="lazy"
        />
      </div>
      <div className="book-card-body">
        <h4>{book.title || 'Kitap'}</h4>
        {book.instructor && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "12px" }}>
            {book.instructor.name}
          </div>
        )}
        <div className="book-card-btns">
          {book.buy_link && (
            <a href={book.buy_link} className="btn-book-buy" target="_blank" rel="noopener noreferrer">
              📦 Satın Al ↗
            </a>
          )}
          {book.slug && (
            <Link href={`/kitaplar/${book.slug}`} className="btn-book-inspect">
              🔎 Kitabı İncele
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
