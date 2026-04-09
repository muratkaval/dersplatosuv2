"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340";

export default function BookGrid({ books }: { books: any[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState("Tümü");

  const subjectSet = new Set<string>();
  books.forEach((b) =>
    (b.subjects || []).forEach((s: any) => s.name && subjectSet.add(s.name))
  );
  const subjects = ["Tümü", ...Array.from(subjectSet).sort()];

  const filtered = books.filter((b) => {
    const matchSearch = b.title?.toLowerCase().includes(search.toLowerCase());
    const matchSub =
      activeSubject === "Tümü" ||
      (b.subjects || []).some((s: any) => s.name === activeSubject);
    return matchSearch && matchSub;
  });

  return (
    <div className="info-card">
      {/* Search */}
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <span className="ms" style={{
          position: "absolute", left: "14px", top: "50%",
          transform: "translateY(-50%)", color: "#60a5fa", fontSize: "20px",
          pointerEvents: "none", zIndex: 1,
        }}>search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kitap ara..."
          style={{
            width: "100%", paddingLeft: "44px", paddingRight: "16px",
            paddingTop: "12px", paddingBottom: "12px",
            background: "#0b1628", border: "1.5px solid #1e3a5f",
            borderRadius: "10px", color: "#e2e8f0", fontSize: "0.9rem",
            outline: "none", boxSizing: "border-box",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1e3a5f")}
        />
      </div>

      {/* Subject tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
        {subjects.map((sub) => {
          const active = sub === activeSubject;
          return (
            <button key={sub} type="button" onClick={() => setActiveSubject(sub)} style={{
              padding: "5px 16px", borderRadius: "50px", border: "none",
              cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem",
              fontWeight: active ? 700 : 400,
              background: active ? "#3b82f6" : "rgba(255,255,255,0.05)",
              color: active ? "#fff" : "#64748b",
              boxShadow: active ? "0 0 10px rgba(59,130,246,0.35)" : "none",
              transition: "all 0.15s",
            }}>
              {sub}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: "0.72rem", color: "#475569", marginBottom: "16px" }}>
        {filtered.length} kitap — bir kitaba tıklayarak çözüm videolarını yönetin
      </div>

      {/* Book grid */}
      {filtered.length === 0 ? (
        <p style={{ color: "#475569", textAlign: "center", padding: "40px" }}>Kitap bulunamadı</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: "20px",
        }}>
          {filtered.map((b) => {
            const coverUrl = b.cover?.url
              ? (b.cover.url.startsWith("http") ? b.cover.url : `${STRAPI}${b.cover.url}`)
              : null;
            const subjectNames = (b.subjects || []).map((s: any) => s.name).join(" · ");

            return (
              <button
                key={b.documentId}
                type="button"
                onClick={() => router.push(`/admin/soru-cozumleri?book=${b.documentId}`)}
                title={b.title}
                style={{
                  all: "unset", cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  borderRadius: "14px", overflow: "hidden",
                  background: "#0b1221",
                  border: "1px solid #1a2e47",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = "0 12px 32px rgba(59,130,246,0.25)";
                  el.style.borderColor = "#3b82f6";
                  const overlay = el.querySelector(".bk-overlay") as HTMLElement;
                  const arrow = el.querySelector(".bk-arrow") as HTMLElement;
                  if (overlay) overlay.style.opacity = "1";
                  if (arrow) { arrow.style.opacity = "1"; arrow.style.transform = "translateY(0)"; }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)";
                  el.style.borderColor = "#1a2e47";
                  const overlay = el.querySelector(".bk-overlay") as HTMLElement;
                  const arrow = el.querySelector(".bk-arrow") as HTMLElement;
                  if (overlay) overlay.style.opacity = "0";
                  if (arrow) { arrow.style.opacity = "0"; arrow.style.transform = "translateY(8px)"; }
                }}
              >
                {/* Cover */}
                <div style={{ width: "100%", aspectRatio: "3/4", position: "relative", overflow: "hidden" }}>
                  {coverUrl ? (
                    <img src={coverUrl} alt={b.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%", background: "#0b1a2e",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#1e3a5f",
                    }}>
                      <span className="ms" style={{ fontSize: "3rem" }}>menu_book</span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="bk-overlay" style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(15,26,46,0.92) 0%, rgba(15,26,46,0.3) 60%, transparent 100%)",
                    opacity: 0, transition: "opacity 0.25s",
                    display: "flex", alignItems: "flex-end", justifyContent: "center",
                    paddingBottom: "20px",
                  }}>
                    <div className="bk-arrow" style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "#3b82f6", color: "#fff", borderRadius: "50px",
                      padding: "8px 18px", fontSize: "0.8rem", fontWeight: 700,
                      opacity: 0, transform: "translateY(8px)",
                      transition: "opacity 0.2s, transform 0.2s",
                    }}>
                      <span className="ms" style={{ fontSize: "16px" }}>play_arrow</span>
                      Videoları Yönet
                    </div>
                  </div>

                  {/* Subject badge */}
                  {subjectNames && (
                    <div style={{
                      position: "absolute", top: "8px", left: "8px",
                      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
                      borderRadius: "6px", padding: "3px 8px",
                      fontSize: "0.63rem", color: "#60a5fa", fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}>
                      {subjectNames}
                    </div>
                  )}
                </div>

                {/* Title */}
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{
                    fontSize: "0.82rem", color: "#cbd5e1", fontWeight: 600,
                    lineHeight: 1.45,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {b.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
