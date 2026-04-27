"use client";

import Image from "next/image";
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
    // If it's an array, look inside the first item
    if (Array.isArray(obj)) return findUrl(obj[0]);
    if (obj.url && typeof obj.url === 'string') return obj.url;
    if (obj.data) return findUrl(obj.data);
    if (obj.attributes) return findUrl(obj.attributes);
    if (obj.formats?.small?.url) return obj.formats.small.url;
    if (obj.formats?.thumbnail?.url) return obj.formats.thumbnail.url;
    // Recursively check keys for something that might be a cover/image
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const found = findUrl(obj[key]);
        if (found) return found;
      }
    }
    return null;
  };

  const rawUrl = findUrl(book.cover || book.image || book.thumbnail || book);
  const bookCover = toMediaUrl(rawUrl);
  
  const finalCover = bookCover || '/placeholder-book.png';

  return (
    <div className="book-card-premium">
      <div className="book-card-cover-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
        <Image 
          src={finalCover} 
          alt={book.title || 'Kitap'} 
          className="book-card-cover object-cover"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          onError={(e) => {
            // Simplified fallback for next/image
            // In a real scenario, we might want a state for the fallback
          }}
        />
      </div>
      <div className="book-card-body">
        <h3 className="book-card-title">{book.title || 'Kitap'}</h3>
        
        <div className="book-card-btns">
          {book.buy_link ? (
            <a href={book.buy_link} className="btn-book-buy" target="_blank" rel="noopener noreferrer">
              Satın Al ↗
            </a>
          ) : (
            <button className="btn-book-buy" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Satın Al ↗
            </button>
          )}
          
          <Link href={`/kitaplar/${book.slug || book.id}`} className="btn-book-examine">
            Kitabı İncele
          </Link>
        </div>
      </div>
    </div>
  );
}
