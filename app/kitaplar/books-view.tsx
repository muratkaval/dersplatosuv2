"use client";

import { useState } from "react";
import { toMediaUrl } from "@/app/lib/strapi";

function toSlug(v: string) {
  return (v || '')
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function BooksView({ books, subjects }: { books: any[], subjects: any[] }) {
  const [activeFilter, setActiveFilter] = useState("tumu");

  // Filtre etiketlerini cikar
  const uniqueSubjectsMap = new Map();
  subjects.forEach(s => {
    const name = s.name || '';
    const slug = toSlug(name);
    if(name && slug && !uniqueSubjectsMap.has(slug)) {
      uniqueSubjectsMap.set(slug, name);
    }
  });

  const filterChips = Array.from(uniqueSubjectsMap.entries()).map(([slug, name]) => ({
    slug, name
  }));

  return (
    <>
      <div className="books-filter-bar">
        <div className="books-filter">
          <button 
            className={`filter-chip ${activeFilter === 'tumu' ? 'active' : ''}`}
            onClick={() => setActiveFilter('tumu')}
          >
            Tümü
          </button>
          {filterChips.map(chip => (
            <button
              key={chip.slug}
              className={`filter-chip ${activeFilter === chip.slug ? 'active' : ''}`}
              onClick={() => setActiveFilter(chip.slug)}
            >
              {chip.name}
            </button>
          ))}
        </div>
      </div>

      <div className="books-main">
        <div className="container">
          <div className="books-all-grid" style={{ minHeight: '400px' }}>
            {books.map((book) => {
              // Extract subjects of the book for filtering
              const bookSubjects = Array.isArray(book.subjects) ? book.subjects : (book.subjects?.data || []);
              const bookSlugs = bookSubjects.map((s: any) => toSlug(s.name || ''));
              
              const isVisible = activeFilter === 'tumu' || bookSlugs.includes(activeFilter);

              if (!isVisible) return null;

              return (
                <div key={book.id || book.documentId} className="book-item">
                  <div className="book-cover-wrap">
                    <img src={toMediaUrl(book.cover?.url || "") || "https://via.placeholder.com/200x280?text=Kitap"} alt={book.title} loading="lazy" />
                  </div>
                  <div className="book-details">
                    <h4>{book.title}</h4>
                    {book.buy_link && (
                      <a className="btn-buy-book" href={book.buy_link} target="_blank" rel="noopener noreferrer">
                        📦 Satın Al ↗
                      </a>
                    )}
                    {book.solution_link && (
                      <a href={book.solution_link} className="btn-demo" target="_blank" rel="noopener noreferrer" style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: '8px 12px',
                          borderRadius: '7px',
                          fontSize: '.8rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          marginTop: '8px',
                          background: 'rgba(37,99,235,.12)',
                          color: '#3b82f6',
                          border: '1px solid rgba(37,99,235,.25)'
                      }}>
                        🔎 Kitabı İncele
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
