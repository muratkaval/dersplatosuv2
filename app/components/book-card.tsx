import Link from "next/link";
import { toMediaUrl } from "@/app/lib/strapi";

interface BookCardProps {
  book: any;
}

export default function BookCard({ book }: BookCardProps) {
  const bookCover = toMediaUrl(book.cover?.url || book.cover?.formats?.small?.url);
  
  return (
    <div className="book-card-premium">
      <div className="book-card-cover-wrap">
        <img 
          src={bookCover || 'https://via.placeholder.com/200x280?text=Kitap'} 
          alt={book.title} 
          className="book-card-cover"
          loading="lazy"
        />
        <div className="play-overlay">
          <div className="play-button-circle">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="book-card-body">
        <h4>{book.title || 'Kitap'}</h4>
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
