"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toMediaUrl } from "@/app/lib/strapi";

interface Instructor {
  id: number | string;
  name: string;
  slug: string;
  photo?: {
    url?: string;
    formats?: {
      thumbnail?: { url?: string };
    };
  } | null;
  subjects?: Array<{ name?: string }>;
}

interface Props {
  instructors: Instructor[];
}

export default function InstructorScroll({ instructors }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // AUTO-SLIDE LOGIC
  useEffect(() => {
    if (isDown || isPaused || instructors.length < 5) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // If reached near end, scroll back to start
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isDown, isPaused, instructors.length]);

  // DRAG LOGIC
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
    setIsPaused(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast factor
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div 
      className="story-scroll-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className={`story-scroll ${isDown ? 'dragging' : ''}`} 
        id="storyScroll"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ cursor: isDown ? 'grabbing' : 'grab' }}
      >
        {instructors.map((instructor) => (
          <Link
            key={instructor.id}
            href={`/hoca/${instructor.slug}`}
            className="story-item"
            style={{ textDecoration: "none" }}
            onClick={(e) => {
                // Prevent navigation if we were dragging
                if (isDown) e.preventDefault();
            }}
          >
            <div className="story-ring">
              {instructor.photo?.url ? (
                <img
                  src={toMediaUrl(instructor.photo?.formats?.thumbnail?.url || instructor.photo?.url) || ""}
                  alt={instructor.name}
                  className="story-img"
                  draggable={false} // Prevent default image drag
                />
              ) : (
                <div className="story-fallback flex items-center justify-center text-3xl h-full w-full bg-slate-800 rounded-full border-4 border-[#050b1f]">👨‍🏫</div>
              )}
            </div>
            <span className="story-name">{instructor.name}</span>
            <span className="story-subject">{instructor.subjects?.[0]?.name || "Eğitmen"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
