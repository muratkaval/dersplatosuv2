"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { toMediaUrl, type Program } from "@/app/lib/strapi";

type NetBucket = { min: number; max: number | null };

const DEFAULT_NETS: NetBucket[] = [
  { min: 0, max: 10 },
  { min: 10, max: 20 },
  { min: 20, max: 30 },
  { min: 30, max: 40 },
  { min: 40, max: null },
];

function bucketLabel(b: NetBucket) {
  return b.max == null || b.max <= b.min ? `${b.min}+ net` : `${b.min}-${b.max} net`;
}

function slugify(t = "") {
  return t.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function subjSlug(s: any): string {
  return s?.slug || slugify(s?.name || "");
}

function netLabel(p: Program): string | null {
  const hasMin = typeof p.netMin === "number";
  const hasMax = typeof p.netMax === "number";
  if (!hasMin && !hasMax) return null;
  if (hasMax && (p.netMax as number) >= 9999) return `${p.netMin}+ net`;
  if (hasMin && hasMax) return `${p.netMin}-${p.netMax} net`;
  return `${p.netMin ?? p.netMax} net`;
}

export default function ProgramFilter({ programs, netBuckets, examOptions }: { programs: Program[]; netBuckets?: NetBucket[]; examOptions?: string[] }) {
  const [exam, setExam] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [bucketIdx, setBucketIdx] = useState<number | null>(null);

  const NETS = useMemo(
    () =>
      (netBuckets && netBuckets.length ? netBuckets : DEFAULT_NETS).map((b) => {
        const min = Number(b.min) || 0;
        const max = b.max === null || b.max === undefined || (b.max as any) === "" ? null : Number(b.max);
        return { min, max, label: bucketLabel({ min, max }) };
      }),
    [netBuckets]
  );

  const derivedExams = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => p.examType && set.add(p.examType));
    return Array.from(set);
  }, [programs]);
  const examTypes = examOptions && examOptions.length ? examOptions : derivedExams;

  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    programs.forEach((p) => {
      if (exam && p.examType !== exam) return;
      (p.subjects || []).forEach((s: any) => {
        const name = s?.name;
        const slug = subjSlug(s);
        if (name && slug) map.set(slug, name);
      });
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [programs, exam]);

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      if (exam && p.examType !== exam) return false;
      if (subject === "genel") {
        if ((p.subjects || []).length > 0) return false;
      } else if (subject) {
        const has = (p.subjects || []).some((s: any) => subjSlug(s) === subject);
        if (!has) return false;
      }
      if (bucketIdx !== null) {
        const b = NETS[bucketIdx];
        const bMax = b.max == null ? Infinity : b.max;
        const min = typeof p.netMin === "number" ? p.netMin : 0;
        const max = typeof p.netMax === "number" ? p.netMax : 9999;
        if (max < b.min || min > bMax) return false;
      }
      return true;
    });
  }, [programs, exam, subject, bucketIdx, NETS]);

  const Step = ({ no, label }: { no: number; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "0 0 12px" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "50%", background: "var(--accent, #2563eb)", color: "#fff", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>{no}</span>
      <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{label}</span>
    </div>
  );

  return (
    <div className="program-filter">
      <div style={{ marginBottom: "28px" }}>
        <Step no={1} label="Sınavını seç" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {examTypes.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { setExam(exam === e ? null : e); setSubject(null); }}
              className={`filter-pill ${exam === e ? "active" : ""}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {subjects.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <Step no={2} label="Branş seç" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button type="button" onClick={() => setSubject(null)} className={`filter-pill ${subject === null ? "active" : ""}`}>Tümü</button>
            <button type="button" onClick={() => setSubject("genel")} className={`filter-pill ${subject === "genel" ? "active" : ""}`}>Genel</button>
            {subjects.map((s) => (
              <button key={s.slug} type="button" onClick={() => setSubject(s.slug)} className={`filter-pill ${subject === s.slug ? "active" : ""}`}>{s.name}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: "36px" }}>
        <Step no={3} label="Net aralığını seç" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button type="button" onClick={() => setBucketIdx(null)} className={`filter-pill ${bucketIdx === null ? "active" : ""}`}>Tümü</button>
          {NETS.map((b, i) => (
            <button key={b.label} type="button" onClick={() => setBucketIdx(bucketIdx === i ? null : i)} className={`filter-pill ${bucketIdx === i ? "active" : ""}`}>{b.label}</button>
          ))}
        </div>
      </div>

      <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "20px" }}>
        {filtered.length} program bulundu
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          Bu seçime uygun program bulunamadı. Filtreyi değiştirmeyi dene.
        </div>
      ) : (
        <div className="courses-grid">
          {filtered.map((p) => {
            const cover = toMediaUrl(p.cover?.url);
            const pdf = toMediaUrl(p.downloadPdf?.url);
            const subjectNames = (p.subjects || []).map((s: any) => s?.name).filter(Boolean).join(", ");
            const weeks = p.weeks?.length || 0;
            const net = netLabel(p);
            return (
              <div key={p.id} className="course-card" style={{ display: "flex", flexDirection: "column" }}>
                <Link href={`/programlar/${p.slug}`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
                  <div className="course-thumb" style={{ aspectRatio: "16 / 9", height: "auto", position: "relative", overflow: "hidden" }}>
                    {cover ? (
                      <Image src={cover} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
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
                    {p.examType && <span className="program-tag">{p.examType}</span>}
                    {subjectNames ? <span className="program-tag">{subjectNames}</span> : <span className="program-tag">Genel</span>}
                    {net && <span className="program-tag">{net}</span>}
                    {weeks > 0 && <span className="program-tag">{weeks} hafta</span>}
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

      <style>{`
        .program-tag{font-size:0.78rem;padding:4px 10px;border-radius:6px;background:var(--bg-secondary,#f1f1f1);color:var(--text-muted,#666);white-space:nowrap}
        .program-filter .filter-pill{padding:14px 28px;font-size:1.05rem;border-radius:14px}
      `}</style>
    </div>
  );
}
