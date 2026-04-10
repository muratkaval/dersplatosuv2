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
    </div>
  );
}
