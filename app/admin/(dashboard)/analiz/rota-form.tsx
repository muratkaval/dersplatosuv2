"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  toMediaUrl,
  netLevelWord,
  liveExamCombinations,
  netLevelsKey,
  NET_BRANCH_SHORT,
  LIVE_EXAM_TYPE,
  type NetBranch,
  type NetLevels,
  type LiveExamConfig,
} from "@/app/lib/strapi";

const TONE: Record<NetBranch, string> = {
  mat: "#3b82f6",
  turkce: "#f97316",
  fen: "#22c55e",
  sosyal: "#a855f7",
};

const fieldStyle: React.CSSProperties = {
  padding: "10px",
  background: "#060d1a",
  border: "1px solid #1e3a5f",
  color: "#e2e8f0",
  borderRadius: "6px",
  outline: "none",
  width: "100%",
};

function slugify(t: string) {
  return t
    .toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function uploadFile(file: File): Promise<number | null> {
  const fd = new FormData();
  fd.append("files", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (res.ok && data?.[0]) return data[0].id;
  return null;
}

export default function RotaForm({
  program,
  initialLevels,
  branches,
  config,
  taken,
  analizId,
  analizSlug,
  books = [],
  instructors = [],
}: {
  program?: any;
  /** Kapsama şeridinden gelen ön seçim. Yoksa ilk boş kombinasyon seçilir. */
  initialLevels?: NetLevels;
  branches: NetBranch[];
  config: LiveExamConfig;
  /** Başka programların tuttuğu kombinasyonlar: comboKey -> program başlığı. */
  taken: Record<string, string>;
  /** Programin baglanacagi analizin documentId degeri. */
  analizId: string;
  /** Sadece slug ipucunu gostermek icin. */
  analizSlug: string;
  books?: any[];
  instructors?: any[];
}) {
  const router = useRouter();
  const isEdit = !!program?.documentId;

  const combos = useMemo(() => liveExamCombinations(branches), [branches]);

  const [comboKey, setComboKey] = useState<string>(() => {
    if (initialLevels) {
      const k = netLevelsKey(initialLevels, branches);
      if (combos.some((c) => netLevelsKey(c, branches) === k)) return k;
    }
    // Ön seçim yoksa ilk boş kombinasyona düş; hepsi doluysa ilkine.
    const free = combos.find((c) => !(netLevelsKey(c, branches) in taken));
    return netLevelsKey(free || combos[0], branches);
  });

  const [title, setTitle] = useState(program?.title || "");
  const [slug, setSlug] = useState(program?.slug || "");
  const [routeCode, setRouteCode] = useState(program?.routeCode || "");
  const [description, setDescription] = useState(program?.description || "");
  const [videoUrl, setVideoUrl] = useState(program?.videoUrl || "");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(toMediaUrl(program?.cover?.url));
  const coverId = program?.cover?.id ?? null;

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>(program?.downloadPdf?.name || "");
  const pdfId = program?.downloadPdf?.id ?? null;

  const [selBooks, setSelBooks] = useState<string[]>(
    (program?.books || []).map((b: any) => b.documentId || String(b.id))
  );
  const [selInstructors, setSelInstructors] = useState<string[]>(
    (program?.instructors || []).map((i: any) => i.documentId || String(i.id))
  );

  const toggle = (setter: (fn: (p: string[]) => string[]) => void) => (id: string) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleBook = toggle(setSelBooks);
  const toggleInstructor = toggle(setSelInstructors);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const levels = useMemo<NetLevels>(() => {
    const found = combos.find((c) => netLevelsKey(c, branches) === comboKey);
    return found || combos[0];
  }, [combos, branches, comboKey]);

  function comboLabel(c: NetLevels): string {
    return branches
      .map((b) => `${NET_BRANCH_SHORT[b]} ${config.thresholds[b]} ${netLevelWord(c[b])}`)
      .join(" · ");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Başlık zorunlu", "error");
      return;
    }
    if (taken[comboKey]) {
      showToast("Bu kombinasyon başka bir programda dolu", "error");
      return;
    }
    setSaving(true);
    try {
      let finalCoverId = coverId;
      if (coverFile) finalCoverId = (await uploadFile(coverFile)) ?? coverId;

      let finalPdfId = pdfId;
      if (pdfFile) finalPdfId = (await uploadFile(pdfFile)) ?? pdfId;

      const payload: any = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        // Şemada examType zorunlu; rota programlarına sabit değer veriyoruz.
        examType: LIVE_EXAM_TYPE,
        examTypes: [LIVE_EXAM_TYPE],
        analysis: analizId,
        routeCode: routeCode.trim() || null,
        matLevel: levels.mat || null,
        turkceLevel: levels.turkce || null,
        fenLevel: levels.fen || null,
        sosyalLevel: levels.sosyal || null,
        description,
        videoUrl,
        books: selBooks,
        instructors: selInstructors,
        ...(finalCoverId ? { cover: finalCoverId } : {}),
        ...(finalPdfId ? { downloadPdf: finalPdfId } : {}),
      };

      const res = await fetch(
        isEdit ? `/api/admin/programs/${program.documentId}` : "/api/admin/programs",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data?.error || "Kayıt hatası", "error");
        return;
      }
      showToast(isEdit ? "Program güncellendi ✓" : "Program eklendi ✓");
      setTimeout(() => router.push(`/admin/analiz/${analizId}`), 900);
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      {/* Kombinasyon seçimi. Başka programın tuttuğu kombinasyonlar pasif. */}
      <div className="info-card" style={{ marginBottom: "20px" }}>
        <div className="card-title">
          <span className="ms">track_changes</span> Bu Program Hangi Nete Gelecek?
        </div>

        <div className="form-group">
          <label>Net Kombinasyonu</label>
          <select value={comboKey} onChange={(e) => setComboKey(e.target.value)} style={fieldStyle}>
            {combos.map((c) => {
              const k = netLevelsKey(c, branches);
              const owner = taken[k];
              return (
                <option key={k} value={k} disabled={!!owner}>
                  {comboLabel(c)}
                  {owner ? `  —  dolu: ${owner}` : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
          {branches.map((b) => (
            <span
              key={b}
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: "7px",
                whiteSpace: "nowrap",
                color: TONE[b],
                background: `${TONE[b]}1f`,
              }}
            >
              {NET_BRANCH_SHORT[b]} {config.thresholds[b]} {netLevelWord(levels[b])}
            </span>
          ))}
        </div>

        <p style={{ fontSize: "0.7rem", color: "#475569", margin: "12px 0 0", lineHeight: 1.55 }}>
          Netleri bu değerlere uyan öğrenciye bu program gösterilir. Dolu kombinasyonlar listede pasif;
          bir kombinasyona iki program atanamaz.
        </p>
      </div>

      <div className="admin-2col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Sol */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="info-card">
            <div className="card-title"><span className="ms">edit_note</span> Temel Bilgiler</div>

            <div className="form-group">
              <label>Başlık</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!isEdit) setSlug(slugify(e.target.value));
                }}
                placeholder="Örn: Rota A — Temel Seviye Programı"
              />
            </div>

            <div className="form-group">
              <label>URL Slug</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  /analiz/${analizSlug}/
                </span>
                <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="rota-a" />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: "150px" }}>
              <label>Rota Kodu</label>
              <input
                value={routeCode}
                onChange={(e) => setRouteCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="A"
                style={{ textTransform: "uppercase", fontWeight: 700 }}
              />
            </div>
            <p style={{ fontSize: "0.68rem", color: "#475569", margin: "-8px 0 16px" }}>
              Sitede &quot;Rota A&quot; şeklinde büyük başlık olarak görünür. Boş bırakırsan program adı gösterilir.
            </p>

            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Bu rotanın kime uygun olduğunu ve neyi hedeflediğini kısaca anlat."
                style={fieldStyle}
              />
            </div>
          </div>
        </div>

        {/* Sağ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="info-card">
            <div className="card-title"><span className="ms">collections</span> İçerik</div>

            <div className="form-group">
              <label>Tanıtım Videosu (YouTube)</label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtu.be/... veya video ID"
              />
            </div>
            <p style={{ fontSize: "0.68rem", color: "#475569", margin: "-8px 0 16px" }}>
              Her rotanın kendi videosu olabilir. Detay sayfasında gömülü oynatıcı olarak açılır.
            </p>

            <div className="form-group">
              <label>Program PDF</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <label className="btn btn-ghost btn-sm" style={{ borderStyle: "solid", borderColor: "#1e3a5f", cursor: "pointer", flexShrink: 0 }}>
                  <span className="ms">upload_file</span> PDF Seç
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setPdfFile(f);
                      if (f) setPdfName(f.name);
                    }}
                  />
                </label>
                <span style={{ fontSize: "0.78rem", color: pdfName ? "#94a3b8" : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pdfName || "Seçilmedi"}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Kapak Görseli (opsiyonel)</label>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <div style={{ width: "80px", height: "50px", background: "#0f172a", border: "1.5px dashed #1e3a5f", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className="ms" style={{ color: "#334155", fontSize: "20px" }}>image</span>
                  )}
                </div>
                <label className="btn btn-ghost btn-sm" style={{ flex: 1, borderStyle: "solid", borderColor: "#1e3a5f", cursor: "pointer" }}>
                  <span className="ms">upload</span> Görsel Seç
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setCoverFile(f);
                      if (f) setCoverPreview(URL.createObjectURL(f));
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Kitaplar ve hocalar - programlar formundaki ile ayni secim listesi.
          Iliskiler zaten program kaydinda; rota detay sayfasinda gosteriliyor. */}
      <div className="admin-2col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start", marginTop: "20px" }}>
        <div className="info-card">
          <div className="card-title"><span className="ms">menu_book</span> Kitaplar (bu programda kullanılacak)</div>
          <div style={{ maxHeight: "300px", overflowY: "auto", border: "1.5px solid #1a2536", borderRadius: "12px", background: "#060d1a" }}>
            {books.length === 0 ? (
              <div className="empty-state">Kitap bulunamadı.</div>
            ) : (
              books.map((b: any, idx: number) => {
                const id = b.documentId || String(b.id);
                const selected = selBooks.includes(id);
                const isLast = idx === books.length - 1;
                const cov = toMediaUrl(b.cover?.url);
                return (
                  <button key={id} type="button" onClick={() => toggleBook(id)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "9px 14px", background: selected ? "rgba(251,191,36,0.10)" : "transparent", color: selected ? "#fbbf24" : "#94a3b8", border: "none", borderBottom: isLast ? "none" : "1px solid #111d2e", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: selected ? 600 : 400, textAlign: "left" }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, border: selected ? "2px solid #fbbf24" : "2px solid #243249", background: selected ? "#fbbf24" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selected && <span className="ms" style={{ fontSize: "14px", color: "#060d1a", fontWeight: "bold" }}>check</span>}
                    </span>
                    {cov ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cov} alt="" style={{ width: "30px", height: "40px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                    ) : (
                      <span className="ms" style={{ fontSize: "20px", opacity: 0.3, width: "30px", textAlign: "center", flexShrink: 0 }}>menu_book</span>
                    )}
                    <span style={{ flex: 1 }}>{b.title}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="info-card">
          <div className="card-title"><span className="ms">groups</span> Hocalar (programı anlatan)</div>
          <div style={{ maxHeight: "300px", overflowY: "auto", border: "1.5px solid #1a2536", borderRadius: "12px", background: "#060d1a" }}>
            {instructors.length === 0 ? (
              <div className="empty-state">Hoca bulunamadı.</div>
            ) : (
              instructors.map((ins: any, idx: number) => {
                const id = ins.documentId || String(ins.id);
                const selected = selInstructors.includes(id);
                const isLast = idx === instructors.length - 1;
                const photo = toMediaUrl(ins.photo?.url);
                return (
                  <button key={id} type="button" onClick={() => toggleInstructor(id)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "9px 14px", background: selected ? "rgba(16,185,129,0.10)" : "transparent", color: selected ? "#34d399" : "#94a3b8", border: "none", borderBottom: isLast ? "none" : "1px solid #111d2e", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: selected ? 600 : 400, textAlign: "left" }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, border: selected ? "2px solid #34d399" : "2px solid #243249", background: selected ? "#34d399" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selected && <span className="ms" style={{ fontSize: "14px", color: "#060d1a", fontWeight: "bold" }}>check</span>}
                    </span>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <span className="ms" style={{ fontSize: "20px", opacity: 0.3, width: "34px", textAlign: "center", flexShrink: 0 }}>person</span>
                    )}
                    <span style={{ flex: 1 }}>{ins.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
        <button type="button" className="btn btn-ghost" onClick={() => router.push(`/admin/analiz/${analizId}`)}>
          Vazgeç
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <span className="ms">save</span> {saving ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
