"use client";

import { useState, useMemo } from "react";
import BookCard from "./book-card";

interface Subject {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
}

interface Book {
  id: number;
  documentId?: string;
  title: string;
  slug?: string;
  subjects?: Subject[];
  [key: string]: any;
}

interface Props {
  initialBooks: Book[];
  subjects: Subject[];
}

export default function BookFilterableList({ initialBooks, subjects }: Props) {
  const [activeId, setActiveId] = useState<string>("all");

  // Only show subjects that have books
  const relevantSubjects = useMemo(() => {
    return subjects.filter(s => 
      initialBooks.some(b => 
        (b.subjects || []).some(bs => {
          const bsId = bs.documentId || String(bs.id);
          const sId = s.documentId || String(s.id);
          return bsId === sId;
        })
      )
    );
  }, [initialBooks, subjects]);

  const filteredBooks = useMemo(() => {
    if (activeId === "all") return initialBooks;
    
    return initialBooks.filter(book => 
      (book.subjects || []).some(s => {
        const sId = s.documentId || String(s.id);
        return sId === activeId;
      })
    );
  }, [activeId, initialBooks]);

  return (
    <div className="filterable-books">
      {/* Filter Bar */}
      <div className="camp-filter-container" style={{ padding: 0, margin: "0 0 40px 0" }}>
        <div className="camp-filter-scroll">
          <button
            onClick={() => setActiveId("all")}
            className={`filter-pill ${activeId === "all" ? "active" : ""}`}
            style={{ border: "1px solid rgba(59, 130, 246, 0.2)" }}
          >
            Tümü
          </button>
          {relevantSubjects.map((subject) => {
            const sId = subject.documentId || String(subject.id);
            return (
              <button
                key={sId}
                onClick={() => setActiveId(sId)}
                className={`filter-pill ${activeId === sId ? "active" : ""}`}
                style={{ border: "1px solid rgba(59, 130, 246, 0.2)" }}
              >
                {subject.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="books-grid-unified mt-8">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <div key={book.id} className="animate-in">
              <BookCard book={book} />
            </div>
          ))
        ) : (
          <div className="empty-filter-state">
            <span className="ms" style={{ fontSize: "48px", opacity: 0.2, marginBottom: "16px", display: "block" }}>menu_book</span>
            <p>Bu branşta henüz kitap bulunmuyor.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .filterable-books {
          width: 100%;
        }
        .mt-8 {
          margin-top: 2rem;
        }
        .animate-in {
          animation: fadeInUp 0.5s ease forwards;
        }
        .empty-filter-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 20px;
          background: rgba(128, 128, 128, 0.03);
          border: 1px dashed rgba(128, 128, 128, 0.15);
          border-radius: 24px;
          color: var(--text-muted, #64748b);
          font-weight: 500;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
