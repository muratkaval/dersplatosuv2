"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toMediaUrl, type HeroSlide } from "@/app/lib/strapi";
import { renderHeroTitle } from "@/app/lib/hero-title";

type HeroFallback = {
  eyebrow?: string;
  description?: string;
  btn1Text?: string;
  btn1Link?: string;
  btn2Text?: string;
  btn2Link?: string;
};

type Props = {
  slides: HeroSlide[];
  rotateSeconds?: number;
  floatingBadgeTop?: string;
  floatingBadgeBottom?: string;
  fallback?: HeroFallback;
};

const isExt = (u?: string) => /^https?:\/\//.test(u || "");

// Tüm hero (.hero-inner: sol içerik + sağ görsel) admin slaytları arasında döner.
// page.tsx markup'ı/sınıflarıyla birebir aynı tutulur ki public/style.css aynen uygulansın.
// Boş slayt durumunda page.tsx statik hero'ya düşer (bu bileşen hiç render edilmez).
export default function HeroShowcase({ slides, rotateSeconds = 6, floatingBadgeTop, floatingBadgeBottom, fallback = {} }: Props) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (count <= 1 || paused || reduceMotion) return;
    const ms = Math.max(2, rotateSeconds || 6) * 1000;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), ms);
    return () => window.clearInterval(t);
  }, [count, paused, reduceMotion, rotateSeconds]);

  if (count === 0) return null;

  const active = index % count;
  const s = slides[active];
  const img = toMediaUrl(s.image);
  const cardHref = s.imageLink || s.btn1Link || s.link || "#";
  const cardExternal = isExt(cardHref);
  const cardClass = `hero-card course-card${reduceMotion ? "" : " floating"}`;

  // Slayt alanı boşsa global hero ayarına düş (yarı-dolu/eski slaytlar boş görünmez).
  const eyebrow = s.eyebrow ?? fallback.eyebrow;
  const desc = s.description ?? fallback.description;
  const b1Text = s.btn1Text || fallback.btn1Text;
  const b1Link = s.btn1Link || fallback.btn1Link || "#";
  const b2Text = s.btn2Text || fallback.btn2Text;
  const b2Link = s.btn2Link || fallback.btn2Link || "#";

  const visualInner = (
    <>
      <div className="course-thumb hero-course-thumb relative overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={s.title} className="object-cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} loading="eager" />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", color: "var(--text-muted)", fontSize: "2.4rem" }}>📚</div>
        )}
        {s.kind === "Kamp" ? (
          <div className="play-overlay">
            <div className="play-button-circle">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        ) : null}
        {s.badge ? (
          <span style={{ position: "absolute", top: "12px", left: "12px", zIndex: 21, background: "rgba(37,99,235,0.92)", color: "#fff", fontWeight: 700, fontSize: "0.72rem", padding: "5px 10px", borderRadius: "8px" }}>{s.badge}</span>
        ) : null}
      </div>
      <div className="course-body">
        <h3 className="hero-course-title">{s.title}</h3>
        {s.subtitle ? (
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600 }}>{s.subtitle}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <>
    <div
      className="hero-inner"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; touchY.current = e.touches[0].clientY; swiped.current = false; }}
      onTouchEnd={(e) => {
        if (touchX.current == null || touchY.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        const dy = e.changedTouches[0].clientY - touchY.current;
        if (count > 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          swiped.current = true;
          setIndex((i) => (i + (dx < 0 ? 1 : -1) + count) % count);
        }
        touchX.current = null;
        touchY.current = null;
      }}
    >
      {/* Sol içerik (key ile remount -> mevcut giriş animasyonları yeniden çalışır) */}
      <div className="hero-content" key={`c-${active}`}>
        {eyebrow ? <div className="hero-badge">{eyebrow}</div> : null}
        <h1 className="hero-title">{renderHeroTitle(s.title)}</h1>
        {desc ? <p className="hero-desc">{desc}</p> : null}
        <div className="hero-ctas">
          {b1Text ? (
            isExt(b1Link) ? (
              <a className="btn-primary btn-lg pulse-btn" href={b1Link} target="_blank" rel="noopener noreferrer">{b1Text}</a>
            ) : (
              <Link className="btn-primary btn-lg pulse-btn" href={b1Link}>{b1Text}</Link>
            )
          ) : null}
          {b2Text ? (
            isExt(b2Link) ? (
              <a className="btn-outline btn-lg" href={b2Link} target="_blank" rel="noopener noreferrer">{b2Text}</a>
            ) : (
              <Link className="btn-outline btn-lg" href={b2Link}>{b2Text}</Link>
            )
          ) : null}
        </div>
      </div>

      {/* Sağ görsel */}
      <div className="hero-visual" key={`v-${active}`}>
        {cardExternal ? (
          <a href={cardHref} target="_blank" rel="noopener noreferrer" className={cardClass} role="group" aria-label={`${active + 1} / ${count}`} onClickCapture={(e) => { if (swiped.current) { e.preventDefault(); swiped.current = false; } }}>
            {visualInner}
          </a>
        ) : (
          <Link href={cardHref} className={cardClass} role="group" aria-label={`${active + 1} / ${count}`} onClickCapture={(e) => { if (swiped.current) { e.preventDefault(); swiped.current = false; } }}>
            {visualInner}
          </Link>
        )}
        <div className="floating-badge badge-top">
          <span>🎁</span> {floatingBadgeTop || "Ücretsiz!"}
        </div>
        <div className="floating-badge badge-bottom">
          <span>📚</span> {floatingBadgeBottom || "İşler Yayın Grubu Katkıları ile"}
        </div>
      </div>

    </div>

      {/* Noktalar: hero'nun ALTINDA, ortada — absolute değil ki mobilde yüzen rozetle çakışmasın */}
      {count > 1 ? (
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", margin: "18px 0 6px", position: "relative", zIndex: 22 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}. slayt`}
              aria-current={i === active}
              style={{ height: "9px", width: i === active ? "28px" : "9px", borderRadius: "999px", border: "none", padding: 0, cursor: "pointer", background: i === active ? "var(--primary, #2563eb)" : "rgba(148,163,184,0.5)", transition: "all 0.25s ease" }}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
