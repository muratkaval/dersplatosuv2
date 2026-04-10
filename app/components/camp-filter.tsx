"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";

export default function CampFilter({ camps, activeSlug = "" }: { camps: any[], activeSlug?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Extract unique categories from camps
  const categoriesMap = new Map<string, { title: string, count: number }>();
  
  camps.forEach(camp => {
    const cats = Array.isArray(camp.categories) ? camp.categories : (camp.categories?.data || []);
    if (cats.length > 0) {
      cats.forEach((cat: any) => {
        const catTitle = cat.name || cat.attributes?.name || cat.title || cat.attributes?.title;
        if (!catTitle) return;
        
        const slug = cat.slug || cat.attributes?.slug || slugify(catTitle);
        if (categoriesMap.has(slug)) {
          categoriesMap.get(slug)!.count++;
        } else {
          categoriesMap.set(slug, { title: catTitle, count: 1 });
        }
      });
    }
  });

  const categories = Array.from(categoriesMap.entries()).map(([slug, data]) => ({
    slug,
    ...data
  })).sort((a, b) => b.count - a.count); // Most populated first

  function slugify(t: string = "") {
    return t.toLowerCase()
      .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
      .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

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
  }, [categories]);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.7;
      scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    }
  };

  if (categories.length === 0) return null;

  return (
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
        <Link 
          href="/kamplar" 
          className={`filter-pill ${!activeSlug ? "active" : ""}`}
        >
          <span className="ms">apps</span> Tümü
          <span className="filter-count">{camps.length}</span>
        </Link>
        
        {categories.map((cat) => (
          <Link 
            key={cat.slug}
            href={`/kamplar/kategori/${cat.slug}`}
            className={`filter-pill ${activeSlug === cat.slug ? "active" : ""}`}
          >
            {cat.title}
            <span className="filter-count">{cat.count}</span>
          </Link>
        ))}
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

      <style jsx>{`
        .camp-filter-container {
          display: flex;
          align-items: center;
          padding: 0 16px;
        }

        .camp-filter-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* IE and Edge */
          padding: 4px 0;
          flex: 1;
        }

        .camp-filter-scroll::-webkit-scrollbar {
          display: none;
        }

        .filter-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.15);
          color: #94a3b8;
          padding: 10px 20px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .filter-pill:hover {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(59, 130, 246, 0.3);
          color: #e2e8f0;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }

        .filter-pill.active {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(59, 130, 246, 0.9));
          border-color: rgba(96, 165, 250, 0.5);
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
        }

        .filter-count {
          background: rgba(0,0,0,0.2);
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .filter-pill.active .filter-count {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        .filter-scroll-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: all 0.2s;
        }

        .filter-scroll-btn:hover {
          background: #2563eb;
          border-color: #60a5fa;
        }

        .filter-scroll-btn.left {
          left: -10px;
        }

        .filter-scroll-btn.right {
          right: -10px;
        }

        @media (max-width: 768px) {
          .camp-filter-container {
            padding: 0;
          }
          .filter-pill {
            padding: 8px 16px;
            font-size: 0.8rem;
          }
          .filter-scroll-btn {
            display: none !important; /* Touch scrolling is enough on mobile */
          }
        }
      `}</style>
    </div>
  );
}
