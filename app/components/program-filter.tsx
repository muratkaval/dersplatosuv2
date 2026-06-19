"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toMediaUrl, periodUnitWord, programDurationCount, programCategories, type Program } from "@/app/lib/strapi";

type Category = { name: string; options: string[] };

// Admin'den (programCategoryOptions) gelmezse varsayilan ana kategori + alt kategoriler.
const DEFAULT_CATEGORIES: Category[] = [
  { name: "TYT", options: ["0-60 Net", "60-90 Net", "+90 Net"] },
  { name: "AYT", options: ["Sayısal", "Eşit Ağırlık", "Sözel", "Dil (YDT)"] },
  { name: "Maarif", options: ["9'dan 10'a Geçen", "10'dan 11'e Geçen"] },
  { name: "TYT + 11. Sınıf", options: ["Sayısal", "Eşit Ağırlık", "Sözel"] },
];

export default function ProgramFilter({ programs, categories: catProp }: { programs: Program[]; categories?: Category[] }) {
  const [selCat, setSelCat] = useState<string | null>(null);
  const [selSub, setSelSub] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Mobilde bir ana kategori secilince, asagida acilan alt kategori + sonuclara yumusakca kaydir.
  useEffect(() => {
    if (!selCat) return;
    if (window.matchMedia("(max-width: 760px)").matches) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selCat]);

  const categories = useMemo<Category[]>(() => {
    const raw = catProp && catProp.length ? catProp : DEFAULT_CATEGORIES;
    return raw
      .map((c: any) => ({
        name: String(c?.name || "").trim(),
        options: Array.isArray(c?.options) ? c.options.map((o: any) => String(o).trim()).filter(Boolean) : [],
      }))
      .filter((c) => c.name);
  }, [catProp]);

  const countFor = (name: string) => programs.filter((p) => programCategories(p).includes(name)).length;
  const activeCat = categories.find((c) => c.name === selCat) || null;

  const filtered = useMemo(() => {
    if (!selCat) return [];
    return programs.filter((p) => {
      if (!programCategories(p).includes(selCat)) return false;
      if (selSub && !((p.subOptions || []) as string[]).includes(selSub)) return false;
      return true;
    });
  }, [programs, selCat, selSub]);

  const Step = ({ no, label }: { no: number; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "0 0 14px" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "50%", background: "#2563eb", color: "#fff", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>{no}</span>
      <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{label}</span>
    </div>
  );

  return (
    <div className="program-filter">
      {/* 1 — Ana kategori */}
      <div style={{ marginBottom: "30px" }}>
        <Step no={1} label="Branş seç" />
        <div className="cat-grid">
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => { const next = selCat === c.name ? null : c.name; setSelCat(next); setSelSub(null); }}
              className={`cat-box ${selCat === c.name ? "active" : ""}`}
            >
              <span className="cat-box-title">{c.name}</span>
              <span className="cat-box-count">{countFor(c.name)} program</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobilde kategori secilince buraya kaydirilir (alt kategori + sonuclar) */}
      <div ref={resultsRef} aria-hidden style={{ scrollMarginTop: "16px" }} />

      {/* 2 — Alt kategori */}
      {activeCat && activeCat.options.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <Step no={2} label="Alt kategori seç" />
          <div className="sub-pills" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button type="button" onClick={() => setSelSub(null)} className={`filter-pill ${selSub === null ? "active" : ""}`}>Tümü</button>
            {activeCat.options.map((o) => (
              <button key={o} type="button" onClick={() => setSelSub(selSub === o ? null : o)} className={`filter-pill ${selSub === o ? "active" : ""}`}>{o}</button>
            ))}
          </div>
        </div>
      )}

      {/* Sonuçlar */}
      {!selCat ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
          Başlamak için yukarıdan bir kategori seç.
        </div>
      ) : (
        <>
          <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "20px" }}>
            {filtered.length} program bulundu
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              Bu seçime uygun program bulunamadı. Başka bir alt kategori dene.
            </div>
          ) : (
            <div className="courses-grid">
              {filtered.map((p) => {
                const cover = toMediaUrl(p.cover?.url);
                const pdf = toMediaUrl(p.downloadPdf?.url);
                const durCount = programDurationCount(p);
                const unit = periodUnitWord(p.periodType).toLowerCase();
                const subs = (p.subOptions || []) as string[];
                return (
                  <div key={p.id} className="course-card" style={{ display: "flex", flexDirection: "column" }}>
                    <Link href={`/programlar/${p.slug}`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
                      <div className="course-thumb" style={{ aspectRatio: "16 / 9", height: "auto", position: "relative", overflow: "hidden" }}>
                        {cover ? (
                          <Image src={cover} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                            <span className="ms" style={{ fontSize: "2.5rem" }}>school</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="course-body" style={{ display: "flex", flexDirection: "column", flexGrow: 1, gap: "10px" }}>
                      <Link href={`/programlar/${p.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                        <h3 style={{ fontSize: "1.1rem", lineHeight: 1.4, margin: 0 }}>{p.title}</h3>
                      </Link>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {programCategories(p).map((c) => <span key={c} className="program-tag">{c}</span>)}
                        {subs.map((o) => <span key={o} className="program-tag">{o}</span>)}
                        {durCount > 0 && <span className="program-tag">{durCount} {unit}</span>}
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                        <Link href={`/programlar/${p.slug}`} className="btn-outline" style={{ flex: 1, textAlign: "center" }}>İncele</Link>
                        {pdf && (
                          <a href={pdf} target="_blank" rel="noopener noreferrer" download className="btn-primary" style={{ flex: 1, textAlign: "center" }}>PDF İndir</a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <style>{`
        /* Ana kategori kutulari (2'li) */
        .program-filter .cat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
        .program-filter .cat-box{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:22px 26px;border-radius:18px;border:2px solid rgba(15,23,42,0.1);background:#fff;cursor:pointer;text-align:left;font-family:inherit;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease}
        .program-filter .cat-box:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(37,99,235,0.14);border-color:rgba(59,130,246,0.5)}
        .program-filter .cat-box.active{border-color:#2563eb;background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(37,99,235,0.1));box-shadow:0 10px 26px rgba(37,99,235,0.18)}
        .program-filter .cat-box-title{font-size:1.35rem;font-weight:800;color:#0f172a}
        .program-filter .cat-box-count{font-size:0.85rem;font-weight:600;color:#64748b}
        body[data-theme="dark"] .program-filter .cat-box{background:#0b1530;border-color:rgba(255,255,255,0.1)}
        body[data-theme="dark"] .program-filter .cat-box.active{border-color:#60a5fa;background:linear-gradient(135deg,rgba(96,165,250,0.16),rgba(37,99,235,0.14))}
        body[data-theme="dark"] .program-filter .cat-box-title{color:#f1f5f9}
        body[data-theme="dark"] .program-filter .cat-box-count{color:#94a3b8}
        @media (max-width:520px){.program-filter .cat-grid{grid-template-columns:1fr}}

        /* 2-up modern program kartlari */
        .program-filter .courses-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:26px}
        .program-filter .course-card{background:#fff;border:1px solid rgba(15,23,42,0.08);border-radius:22px;overflow:hidden;box-shadow:0 8px 26px rgba(15,23,42,0.06);transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
        .program-filter .course-card:hover{transform:translateY(-6px);box-shadow:0 24px 50px rgba(37,99,235,0.16);border-color:rgba(59,130,246,0.4)}
        .program-filter .course-body{padding:24px !important;gap:14px !important}
        .program-filter .course-card h3{font-size:1.35rem !important;font-weight:800;color:#0f172a}
        body[data-theme="dark"] .program-filter .course-card h3{color:#f1f5f9}

        .program-tag{font-size:0.8rem;padding:5px 12px;border-radius:8px;background:rgba(15,23,42,0.06);color:#475569;white-space:nowrap;font-weight:600}
        body[data-theme="dark"] .program-tag{background:rgba(255,255,255,0.07);color:#cbd5e1}

        .program-filter .course-card .btn-primary,.program-filter .course-card .btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:14px 18px;border-radius:13px;font-weight:700;font-size:0.96rem;line-height:1;cursor:pointer;text-decoration:none;border:1.5px solid transparent;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
        .program-filter .course-card .btn-primary{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;box-shadow:0 6px 16px rgba(37,99,235,0.28)}
        .program-filter .course-card .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(37,99,235,0.4)}
        .program-filter .course-card .btn-outline{background:transparent;color:#2563eb;border-color:rgba(37,99,235,0.4)}
        .program-filter .course-card .btn-outline:hover{background:rgba(37,99,235,0.08);border-color:#2563eb}

        body[data-theme="dark"] .program-filter .course-card{background:#0b1530;border-color:rgba(255,255,255,0.08);box-shadow:0 10px 30px rgba(0,0,0,0.4)}
        body[data-theme="dark"] .program-filter .course-card:hover{border-color:rgba(96,165,250,0.5)}
        body[data-theme="dark"] .program-filter .course-card .btn-outline{color:#93c5fd;border-color:rgba(147,197,253,0.4)}
        body[data-theme="dark"] .program-filter .course-card .btn-outline:hover{background:rgba(147,197,253,0.12);border-color:#93c5fd}

        .program-filter .filter-pill{padding:14px 28px;font-size:1.05rem;border-radius:14px}
        .program-filter .sub-pills .filter-pill{flex:1 1 0;min-width:130px;text-align:center}
        @media (max-width:520px){.program-filter .sub-pills .filter-pill{flex:1 1 40%}}

        @media (max-width:760px){.program-filter .courses-grid{grid-template-columns:1fr;gap:18px}}
      `}</style>
    </div>
  );
}
