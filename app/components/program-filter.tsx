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
  // open-ended upper bound (stored as null or a sentinel) -> "N+ net"
  if (hasMin && (!hasMax || (p.netMax as number) >= 9999)) return `${p.netMin}+ net`;
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
        // Each program is assigned exactly one net bucket in the admin (single
        // select), so match the chosen bucket exactly rather than by overlap —
        // otherwise a broad "0-40 net" program shows up under every bucket.
        const b = NETS[bucketIdx];
        const norm = (v: number | null | undefined) =>
          v == null || v >= 9999 ? null : v;
        const pMin = typeof p.netMin === "number" ? p.netMin : null;
        const pMax = norm(typeof p.netMax === "number" ? p.netMax : null);
        if (pMin !== b.min || pMax !== norm(b.max)) return false;
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
        /* 2-up modern program cards */
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

        @media (max-width:760px){.program-filter .courses-grid{grid-template-columns:1fr;gap:18px}}
      `}</style>
    </div>
  );
}
