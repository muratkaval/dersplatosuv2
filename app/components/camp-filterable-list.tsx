"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import CourseCard from "./course-card";

interface Props {
  camps: any[];
}

export default function CampFilterableList({ camps }: Props) {
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Extract unique categories from camps
  const categories = useMemo(() => {
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

    return Array.from(categoriesMap.entries()).map(([slug, data]) => ({
      slug,
      ...data
    })).sort((a, b) => b.count - a.count);
  }, [camps]);

  function slugify(t: string = "") {
    return t.toLowerCase()
      .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
      .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  const filteredCamps = useMemo(() => {
    let result = camps;

    // 1) Filter by category slug
    if (activeSlug !== "all") {
      result = result.filter(camp => {
        const cats = Array.isArray(camp.categories) ? camp.categories : (camp.categories?.data || []);
        return cats.some((cat: any) => {
          const slug = cat.slug || cat.attributes?.slug || slugify(cat.name || cat.attributes?.name || cat.title || cat.attributes?.title);
          return slug === activeSlug;
        });
      });
    }

    // 2) Filter by search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(camp =>
        (camp.title || "").toLowerCase().includes(q) ||
        (camp.description || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeSlug, searchQuery, camps]);

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

  return (
    <div className="filterable-camps">
      {/* Search Bar */}
      <div className="search-bar-wrapper">
        <div className="search-bar-inner">
          <input
            type="text"
            placeholder="Kamp ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-field"
          />
          <span className="ms search-icon">search</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="clear-search-btn"
              aria-label="Aramayı Temizle"
            >
              <span className="ms">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {categories.length > 0 && (
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
              onClick={() => setActiveSlug("all")}
              className={`filter-pill ${activeSlug === "all" ? "active" : ""}`}
            >
              <span className="ms">apps</span> Tümü
              <span className="filter-count">{camps.length}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveSlug(cat.slug)}
                className={`filter-pill ${activeSlug === cat.slug ? "active" : ""}`}
              >
                {cat.title}
                <span className="filter-count">{cat.count}</span>
              </button>
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
      )}

      {/* Grid */}
      <div className="courses-grid mt-8">
        {filteredCamps.length > 0 ? (
          filteredCamps.map((camp) => (
            <div key={camp.id} className="animate-in">
              <CourseCard camp={camp} />
            </div>
          ))
        ) : (
          <div className="empty-filter-state">
            <span className="ms" style={{ fontSize: "48px", opacity: 0.2, marginBottom: "16px", display: "block" }}>school</span>
            <p>
              {searchQuery 
                ? `"${searchQuery}" aramasına uygun kamp bulunamadı.` 
                : "Bu kategoride henüz kamp bulunmuyor."}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .filterable-camps {
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
