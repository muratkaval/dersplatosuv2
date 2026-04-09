"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340";

export default function BookSelector({
  books,
  selectedBook,
}: {
  books: any[];
  selectedBook: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState<string>("Tümü");

  // Collect unique subjects from all books
  const subjectSet = new Set<string>();
  books.forEach((b) => {
    (b.subjects || []).forEach((s: any) => {
      if (s.name) subjectSet.add(s.name);
    });
  });
  const subjects = ["Tümü", ...Array.from(subjectSet).sort()];

  // Filter books by search + active subject tab
  const filtered = books.filter((b) => {
    const matchSearch = b.title?.toLowerCase().includes(search.toLowerCase());
    const matchSubject =
      activeSubject === "Tümü" ||
      (b.subjects || []).some((s: any) => s.name === activeSubject);
    return matchSearch && matchSubject;
  });

  function select(docId: string) {
    if (docId === selectedBook) {
      router.push("/admin/soru-cozumleri");
    } else {
      router.push(`/admin/soru-cozumleri?book=${docId}`);
    }
  }

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <span
          className="ms"
          style={{
            position: "absolute", left: "12px", top: "50%",
            transform: "translateY(-50%)", color: "#475569", fontSize: "18px",
            pointerEvents: "none",
          }}
        >search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kitap ara..."
          style={{ paddingLeft: "40px" }}
        />
      </div>

      {/* Subject tabs */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "6px",
        marginBottom: "18px",
      }}>
        {subjects.map((sub) => {
          const isActive = sub === activeSubject;
          return (
            <button
              key={sub}
              type="button"
              onClick={() => setActiveSubject(sub)}
              style={{
                padding: "5px 14px", borderRadius: "50px",
                border: "none", cursor: "pointer", fontFamily: "inherit",
                fontSize: "0.78rem", fontWeight: isActive ? 700 : 400,
                background: isActive ? "#3b82f6" : "rgba(255,255,255,0.05)",
                color: isActive ? "#fff" : "#64748b",
                transition: "all 0.15s",
                boxShadow: isActive ? "0 0 10px rgba(59,130,246,0.35)" : "none",
              }}
            >
              {sub}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <div style={{ fontSize: "0.72rem", color: "#475569", marginBottom: "14px" }}>
        {filtered.length} kitap gösteriliyor
        {selectedBook && (
          <button
            type="button"
            onClick={() => router.push("/admin/soru-cozumleri")}
            style={{
              marginLeft: "12px", background: "none", border: "none",
              color: "#60a5fa", cursor: "pointer", fontSize: "0.72rem",
              fontFamily: "inherit", textDecoration: "underline",
            }}
          >
            Seçimi kaldır
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p style={{ color: "#475569", fontSize: "0.82rem", textAlign: "center", padding: "20px" }}>
          Kitap bulunamadı
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "14px",
        }}>
          {filtered.map((b) => {
            const isSelected = b.documentId === selectedBook;
            const coverUrl = b.cover?.url
              ? (b.cover.url.startsWith("http") ? b.cover.url : `${STRAPI}${b.cover.url}`)
              : null;
            const subjectNames = (b.subjects || []).map((s: any) => s.name).join(", ");

            return (
              <button
                key={b.documentId}
                type="button"
                onClick={() => select(b.documentId)}
                title={b.title}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  borderRadius: "12px",
                  padding: "10px",
                  background: isSelected ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
                  border: isSelected ? "2px solid #3b82f6" : "2px solid #1a2536",
                  transition: "all 0.18s",
                  textAlign: "center",
                  boxShadow: isSelected ? "0 0 14px rgba(59,130,246,0.25)" : "none",
                }}
              >
                {/* Cover */}
                <div style={{
                  width: "100%", aspectRatio: "3/4",
                  borderRadius: "8px", overflow: "hidden",
                  background: "#0b1221", position: "relative",
                }}>
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={b.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#243249",
                    }}>
                      <span className="ms" style={{ fontSize: "2.5rem" }}>menu_book</span>
                    </div>
                  )}

                  {/* Selected overlay */}
                  {isSelected && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(59,130,246,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span className="ms" style={{
                        fontSize: "32px", color: "#fff",
                        background: "#3b82f6", borderRadius: "50%", padding: "4px",
                        boxShadow: "0 0 16px rgba(59,130,246,0.7)",
                      }}>check_circle</span>
                    </div>
                  )}

                  {/* Subject badge */}
                  {subjectNames && (
                    <div style={{
                      position: "absolute", bottom: "4px", left: "4px", right: "4px",
                      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                      borderRadius: "4px", padding: "2px 5px",
                      fontSize: "0.62rem", color: "#94a3b8",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {subjectNames}
                    </div>
                  )}
                </div>

                {/* Title */}
                <span style={{
                  fontSize: "0.73rem",
                  color: isSelected ? "#93c5fd" : "#64748b",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontWeight: isSelected ? 700 : 400,
                }}>
                  {b.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
