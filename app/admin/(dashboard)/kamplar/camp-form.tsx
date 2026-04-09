"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Lesson {
  title: string;
  day: number;
  youtube: string;
  notes_link: string;
}

interface Props {
  camp?: any;
  categories: any[];
  instructors: any[];
  subjects: any[];
  books: any[];
}

function slugify(t: string) {
  return t.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function CampForm({ camp, categories, instructors, subjects, books }: Props) {
  const router = useRouter();
  const isEdit = !!camp?.documentId;

  const [title, setTitle] = useState(camp?.title || "");
  const [slug, setSlug] = useState(camp?.slug || "");
  const [introVideo, setIntroVideo] = useState(camp?.introVideo || "");
  const [playlist, setPlaylist] = useState(camp?.playlist || "");
  const [subjectId, setSubjectId] = useState(camp?.subject?.documentId || camp?.subject?.id || "");
  const [selCats, setSelCats] = useState<string[]>((camp?.categories || []).map((c: any) => c.documentId || String(c.id)));
  const [selIns, setSelIns] = useState<string[]>((camp?.instructors || []).map((c: any) => c.documentId || String(c.id)));
  const [selBooks, setSelBooks] = useState<string[]>((camp?.books || []).map((c: any) => c.documentId || String(c.id)));
  const [lessons, setLessons] = useState<Lesson[]>((camp?.lessons || []).map((l: any) => ({
    title: l.title ?? "",
    day: l.day ?? 0,
    youtube: l.youtube ?? "",
    notes_link: l.notes_link ?? "",
  })));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function toggleMulti(id: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function addLesson() {
    setLessons([...lessons, { title: "", day: lessons.length + 1, youtube: "", notes_link: "" }]);
  }

  function updateLesson(i: number, field: keyof Lesson, value: string | number) {
    const updated = [...lessons];
    (updated[i] as any)[field] = value;
    setLessons(updated);
  }

  function removeLesson(i: number) {
    setLessons(lessons.filter((_, idx) => idx !== i));
  }

  // ── Drag & Drop ───────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function handleDragStart(i: number) {
    setDragIndex(i);
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (i !== dragIndex) setDragOverIndex(i);
  }

  function handleDrop(i: number) {
    if (dragIndex === null || dragIndex === i) return;
    const updated = [...lessons];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(i, 0, moved);
    setLessons(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  // ── CSV Import ────────────────────────────────────────────────
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [showFormatTip, setShowFormatTip] = useState(false);

  function downloadTemplate() {
    const header = "Başlık,Gün No,YouTube URL,Not Linki";
    const example = "Ders 1 - Konuya Giriş,1,https://youtu.be/ORNEK_ID,https://drive.google.com/...";
    const blob = new Blob([`${header}\n${example}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dersler_sablonu.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      // Normalize line endings, skip BOM
      const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      const rows = clean.split("\n").map(r => r.trim()).filter(Boolean);
      if (rows.length < 2) {
        showToast("CSV dosyası boş veya hatalı", "error");
        return;
      }
      // Detect separator (, or ;)
      const sep = rows[0].includes(";") ? ";" : ",";
      // Map header indices (case-insensitive, Turkish-tolerant)
      const headers = rows[0].split(sep).map(h => h.trim().toLowerCase()
        .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u")
        .replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g")
      );
      const col = (candidates: string[]) => {
        for (const c of candidates) {
          const idx = headers.findIndex(h => h.includes(c));
          if (idx !== -1) return idx;
        }
        return -1;
      };
      const iTitle = col(["baslik", "title", "ad", "isim", "ders"]);
      const iDay = col(["gun", "day", "no", "sure"]);
      const iYt = col(["youtube", "yt", "video", "url"]);
      const iNotes = col(["not", "notes", "link", "drive"]);

      if (iTitle === -1) {
        showToast("'Başlık' kolonu bulunamadı", "error");
        return;
      }

      const parsed: Lesson[] = [];
      let startDay = lessons.length;
      rows.slice(1).forEach((row, rowIdx) => {
        // Handle quoted CSV values
        const cols: string[] = [];
        let inQ = false, cur = "";
        for (const ch of row + sep) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === sep && !inQ) { cols.push(cur.trim()); cur = ""; }
          else { cur += ch; }
        }
        const get = (i: number) => (i !== -1 ? cols[i] ?? "" : "");
        const titleVal = get(iTitle);
        if (!titleVal) return;
        parsed.push({
          title: titleVal,
          day: iDay !== -1 ? (parseInt(get(iDay)) || startDay + rowIdx + 1) : startDay + rowIdx + 1,
          youtube: get(iYt),
          notes_link: get(iNotes),
        });
      });

      if (parsed.length === 0) {
        showToast("Hiç geçerli satır bulunamadı", "error");
        return;
      }
      setLessons(prev => [...prev, ...parsed]);
      showToast(`${parsed.length} ders içe aktarıldı ✓`);
    };
    reader.readAsText(file, "UTF-8");
    // Reset so same file can be re-selected
    e.target.value = "";
  }

  async function handleSave() {
    if (!title.trim()) { showToast("Başlık zorunludur", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        title,
        slug: slug || slugify(title),
        introVideo,
        playlist,
        categories: selCats,
        instructors: selIns,
        books: selBooks,
        lessons: lessons.map((l) => ({ title: l.title, day: l.day || 0, youtube: l.youtube, notes_link: l.notes_link })),
        ...(subjectId ? { subject: subjectId } : {}),
      };

      const url = isEdit ? `/api/admin/camps/${camp.documentId}` : "/api/admin/camps";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || "Kayıt hatası", "error");
        return;
      }

      showToast(isEdit ? "Kamp güncellendi ✓" : "Kamp eklendi ✓");
      setTimeout(() => router.push("/admin/kamplar"), 1000);
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Sol Kolon */}
        <div>
          <div className="info-card" style={{ marginBottom: "16px" }}>
            <div className="card-title"><span className="ms">edit_note</span> Temel Bilgiler</div>

            <div className="form-group">
              <label>Başlık</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!isEdit) setSlug(slugify(e.target.value));
                }}
              />
            </div>

            <div className="form-group">
              <label>URL Slug</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "0.82rem", whiteSpace: "nowrap" }}>dersplatosu.com/kamplar/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  style={{ flex: 1 }}
                  placeholder="ornek-kamp-adi"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => { if (title.trim()) setSlug(slugify(title)); }}
                  title="Başlıktan otomatik oluştur"
                  style={{ flexShrink: 0 }}
                >
                  <span className="ms">auto_awesome</span>
                </button>
              </div>
              {slug && (
                <small style={{ color: "#3b82f6", marginTop: "4px", display: "block" }}>
                  🔗 dersplatosu.com/kamplar/<strong>{slug}</strong>
                </small>
              )}
              {!slug && <small>Boş bırakılırsa başlıktan otomatik üretilir</small>}
            </div>

            <div className="form-group">
              <label>Intro Video URL</label>
              <input value={introVideo} onChange={(e) => setIntroVideo(e.target.value)} placeholder="https://youtu.be/..." />
            </div>

            <div className="form-group">
              <label>Playlist URL</label>
              <input value={playlist} onChange={(e) => setPlaylist(e.target.value)} placeholder="https://youtube.com/playlist?list=..." />
            </div>

            <div className="form-group">
              <label>Branş</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">Seç...</option>
                {subjects.map((s) => (
                  <option key={s.documentId || s.id} value={s.documentId || s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="info-card">
            <div className="card-title"><span className="ms">link</span> İlişkiler</div>

            {/* Reusable row-list renderer */}
            {(
              [
                { label: "Kategoriler", items: categories, sel: selCats, setSel: setSelCats, nameKey: "name", accent: "#60a5fa", accentBg: "rgba(59,130,246,0.12)", accentBorder: "rgba(59,130,246,0.3)" },
                { label: "Eğitimciler", items: instructors, sel: selIns, setSel: setSelIns, nameKey: "name", accent: "#34d399", accentBg: "rgba(16,185,129,0.12)", accentBorder: "rgba(16,185,129,0.3)" },
                { label: "Kitaplar", items: books, sel: selBooks, setSel: setSelBooks, nameKey: "title", accent: "#fbbf24", accentBg: "rgba(245,158,11,0.10)", accentBorder: "rgba(245,158,11,0.3)" },
              ] as const
            ).map(({ label, items, sel, setSel, nameKey, accent, accentBg, accentBorder }, gi) => (
              <div key={gi} className="form-group" style={{ marginBottom: gi === 2 ? 0 : undefined }}>
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{label}</span>
                  {sel.length > 0 && (
                    <span style={{ background: accentBg, color: accent, borderRadius: "50px", padding: "1px 10px", fontSize: "0.68rem", fontWeight: 700 }}>
                      {sel.length} / {items.length}
                    </span>
                  )}
                </label>
                <div style={{
                  maxHeight: "200px", overflowY: "auto",
                  border: "1px solid #1a2536", borderRadius: "10px",
                  background: "#060e1a",
                }}>
                  {(items as any[]).map((c, idx) => {
                    const id = c.documentId || String(c.id);
                    const name = c[nameKey as string] as string;
                    const selected = sel.includes(id);
                    const isLast = idx === items.length - 1;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleMulti(id, sel as string[], setSel as any)}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          width: "100%", padding: "10px 14px",
                          background: selected ? accentBg : "transparent",
                          color: selected ? accent : "#94a3b8",
                          border: "none",
                          borderBottom: isLast ? "none" : "1px solid #111d2e",
                          cursor: "pointer", fontFamily: "inherit",
                          fontSize: "0.855rem", fontWeight: selected ? 600 : 400,
                          textAlign: "left",
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        {/* Toggle indicator */}
                        <span style={{
                          width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                          border: selected ? `2px solid ${accent}` : "2px solid #243249",
                          background: selected ? accentBg : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}>
                          {selected && <span className="ms" style={{ fontSize: "12px", color: accent }}>check</span>}
                        </span>
                        <span style={{ flex: 1 }}>{name}</span>
                        {selected && (
                          <span style={{
                            width: "6px", height: "6px", borderRadius: "50%",
                            background: accent, flexShrink: 0,
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ Kolon - Dersler */}
        <div className="info-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              <span className="ms">video_library</span> Dersler ({lessons.length})
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* CSV Import */}
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                style={{ display: "none" }}
                onChange={handleCsvFile}
              />
              <div style={{ position: "relative" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => csvInputRef.current?.click()}
                  onMouseEnter={() => setShowFormatTip(true)}
                  onMouseLeave={() => setShowFormatTip(false)}
                  title="CSV dosyasından toplu ders ekle"
                >
                  <span className="ms">upload_file</span> İçeri Aktar
                </button>
                {showFormatTip && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    background: "#0f1a2e", border: "1px solid #1e3a5f",
                    borderRadius: "10px", padding: "12px 14px", zIndex: 999,
                    width: "280px", fontSize: "0.75rem", color: "#94a3b8",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                    pointerEvents: "none",
                  }}>
                    <div style={{ color: "#60a5fa", fontWeight: 700, marginBottom: "6px" }}>📄 CSV Formatı</div>
                    <code style={{ display: "block", background: "#060d1a", padding: "8px", borderRadius: "6px", color: "#a5f3fc", fontSize: "0.7rem", lineHeight: 1.6 }}>
                      Başlık,Gün No,YouTube URL,Not Linki<br />
                      Ders Adı,1,https://youtu.be/...,<br />
                    </code>
                    <div style={{ marginTop: "8px", color: "#64748b" }}>Virgül (,) veya noktalı virgül (;) ayraç olarak çalışır.</div>
                  </div>
                )}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={downloadTemplate}
                title="Boş CSV şablonu indir"
              >
                <span className="ms">download</span> Şablon
              </button>
              <button className="btn btn-success btn-sm" onClick={addLesson}>
                <span className="ms">add</span> Ders Ekle
              </button>
            </div>
          </div>

          {lessons.length === 0 && (
            <p style={{ color: "#475569", fontSize: "0.82rem" }}>Henüz ders yok.</p>
          )}

          {lessons.map((l, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
              style={{
                background: "#0b1221",
                border: `1px solid ${dragOverIndex === i ? "#3b82f6" : "#1e3a5f"}`,
                borderRadius: "10px", padding: "12px", marginBottom: "10px",
                opacity: dragIndex === i ? 0.4 : 1,
                transition: "border-color 0.15s, opacity 0.15s",
                cursor: "grab",
                boxShadow: dragOverIndex === i ? "0 0 0 2px rgba(59,130,246,0.3)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* Drag handle */}
                  <span
                    className="ms"
                    style={{ color: "#2d4a6e", fontSize: "18px", cursor: "grab", userSelect: "none" }}
                    title="Sürükleyerek sırala"
                  >drag_indicator</span>
                  <strong style={{ color: "#60a5fa", fontSize: "0.82rem" }}>Ders {i + 1}</strong>
                </div>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeLesson(i)}>
                  <span className="ms">delete</span>
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Başlık</label>
                  <input value={l.title} onChange={(e) => updateLesson(i, "title", e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Gün No</label>
                  <input type="number" value={l.day} onChange={(e) => updateLesson(i, "day", parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: "6px", marginTop: "10px" }}>
                <label>YouTube URL</label>
                <input value={l.youtube} onChange={(e) => updateLesson(i, "youtube", e.target.value)} placeholder="https://youtu.be/..." />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Not Linki</label>
                <input value={l.notes_link} onChange={(e) => updateLesson(i, "notes_link", e.target.value)} placeholder="https://..." />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button className="btn btn-ghost" onClick={() => router.push("/admin/kamplar")}>◀ İptal</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </>
  );
}

