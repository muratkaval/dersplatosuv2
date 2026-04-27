"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import BookCard from "./book-card";

import { Book, Subject } from "@/app/lib/strapi";

interface Props {
  initialBooks: Book[];
  subjects: Subject[];
}

export default function BookFilterableList({ initialBooks, subjects }: Props) {
  const [activeId, setActiveId] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [relevantSubjects]);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.7;
      scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    }
  };

  // Count books per subject
  const countForSubject = (sId: string) =>
    initialBooks.filter(b =>
      (b.subjects || []).some(s => (s.documentId || String(s.id)) === sId)
    ).length;

  return (
    <div className="filterable-books">
      {/* Filter Bar */}
      <div className="camp-filter-container" style={{ margin: "0 0 40px 0", position: "relative" }}>
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="filter-scroll-btn left"
            aria-label="Sola Kaydır"
          >
            <span className="ms">chevron_left</span>
          </button>
        )}

        <div
          className="camp-filter-scroll"
          ref={scrollRef}
          onScroll={checkScroll}
        >
          <button
            onClick={() => setActiveId("all")}
            className={`filter-pill ${activeId === "all" ? "active" : ""}`}
          >
            <span className="ms">apps</span> Tümü
            <span className="filter-count">{initialBooks.length}</span>
          </button>

          {relevantSubjects.map((subject) => {
            const sId = subject.documentId || String(subject.id);
            const count = countForSubject(sId);
            return (
              <button
                key={sId}
                onClick={() => setActiveId(sId)}
                className={`filter-pill ${activeId === sId ? "active" : ""}`}
              >
                {subject.name}
                <span className="filter-count">{count}</span>
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="filter-scroll-btn right"
            aria-label="Sağa Kaydır"
          >
            <span className="ms">chevron_right</span>
          </button>
        )}
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
