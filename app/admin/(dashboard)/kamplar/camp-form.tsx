"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Lesson {
  id?: string; // For dnd-kit stable IDs
  title: string;
  day: number;
  youtube: string;
  notes_link: string;
  group_title?: string;
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
  const [displayType, setDisplayType] = useState<"daily" | "topic" | "sequential">(camp?.displayType || "daily");
  const [heroMode, setHeroMode] = useState<"video" | "image">(camp?.heroMode || "video");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(camp?.cover?.url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lessons, setLessons] = useState<Lesson[]>((camp?.lessons || []).map((l: any, idx: number) => ({
    id: l.id || `l-${Date.now()}-${idx}`,
    title: l.title ?? "",
    day: l.day ?? 0,
    youtube: l.youtube ?? "",
    notes_link: l.notes_link ?? "",
    group_title: l.group_title ?? "",
  })));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const typeLabel = displayType === "daily" ? "Gün" : displayType === "topic" ? "Konu" : "Bölüm";

  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1])); // Default Day 1 open
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function showToast(msg: string, type: "success" | "error" = "success") {
// ...
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function toggleMulti(id: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function toggleDay(dayNum: number) {
    setOpenDays((prev) => {
      const s = new Set(prev);
      s.has(dayNum) ? s.delete(dayNum) : s.add(dayNum);
      return s;
    });
  }

  function addDay() {
    const maxDay = lessons.length > 0 ? Math.max(...lessons.map(l => l.day)) : 0;
    const nextDay = maxDay + 1;
    setLessons([...lessons, { id: `l-${Date.now()}`, title: "", day: nextDay, youtube: "", notes_link: "" }]);
    setOpenDays(prev => new Set([...Array.from(prev), nextDay]));
  }

  function addLessonToDay(dayNum: number) {
    setLessons([...lessons, { id: `l-${Date.now()}`, title: "", day: dayNum, youtube: "", notes_link: "" }]);
    setOpenDays(prev => new Set([...Array.from(prev), dayNum]));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  function addLessonDirectly() {
    setLessons([...lessons, { id: `l-${Date.now()}`, title: "", day: 1, youtube: "", notes_link: "" }]);
  }

  function updateLesson(id: string, field: keyof Lesson, value: string | number) {
    setLessons(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  }

  function removeLesson(id: string) {
    setLessons(prev => prev.filter(l => l.id !== id));
  }

  function updateGroupTitle(dayNum: number, title: string) {
    setLessons(prev => prev.map(l => l.day === dayNum ? { ...l, group_title: title } : l));
  }

  function removeDay(dayNum: number) {
    if (!confirm(`${dayNum}. ${typeLabel} ve içindeki tüm dersleri silmek istediğinize emin misiniz?`)) return;
    setLessons(prev => prev.filter(l => l.day !== dayNum));
  }

  // Grouping logic for rendering
  const dayGroups: Record<number, Lesson[]> = {};
  lessons.forEach(l => {
    if (!dayGroups[l.day]) dayGroups[l.day] = [];
    dayGroups[l.day].push(l);
  });
  const sortedDayNumbers = Object.keys(dayGroups).map(Number).sort((a,b) => a-b);

  function autoOrderDays() {
    setLessons(prev => prev.map((l, i) => ({ ...l, day: i + 1 })));
    showToast(`${typeLabel} numaraları başarıyla sıralandı ✓`);
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

  function handleDrop(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a day or a lesson
    if (activeId.startsWith("day-")) {
      const activeDay = parseInt(activeId.replace("day-", ""));
      const overDay = parseInt(overId.replace("day-", ""));
      // Simple logic: re-assign day numbers based on move
      // (This is a simplified reorder for days)
      const dayNums = [...sortedDayNumbers];
      const oldIdx = dayNums.indexOf(activeDay);
      const newIdx = dayNums.indexOf(overDay);
      const movedDayNums = arrayMove(dayNums, oldIdx, newIdx);
      
      const updated = lessons.map(l => {
        const newDay = movedDayNums.indexOf(l.day) + 1;
        return { ...l, day: newDay };
      });
      setLessons(updated);
    } else {
      const oldIdx = lessons.findIndex(l => l.id === activeId);
      const newIdx = lessons.findIndex(l => l.id === overId);
      // Ensure same day
      if (lessons[oldIdx].day !== lessons[newIdx].day) return;
      setLessons(arrayMove(lessons, oldIdx, newIdx));
    }
    
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
          id: `l-csv-${Date.now()}-${rowIdx}`,
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
      let coverId = null;

      // Görsel yükleme işlemi
      if (coverFile) {
        const formData = new FormData();
        formData.append("files", coverFile);
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData[0]) {
          coverId = uploadData[0].id;
        } else {
          showToast("Görsel yüklenemedi", "error");
          setSaving(false);
          return;
        }
      }

      const payload = {
        title,
        slug: slug || slugify(title),
        introVideo,
        playlist,
        categories: selCats,
        instructors: selIns,
        books: selBooks,
        displayType,
        heroMode,
        lessons: lessons.map((l) => ({ 
          title: l.title, 
          day: l.day || 0, 
          youtube: l.youtube, 
          notes_link: l.notes_link,
          group_title: l.group_title 
        })),
        ...(subjectId ? { subject: subjectId } : {}),
        ...(coverId ? { cover: coverId } : {}),
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
            </div>

            {slug && (
              <small style={{ color: "#3b82f6", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>🔗 dersplatosu.com/kamplar/</span><strong>{slug}</strong>
              </small>
            )}
            {!slug && <small style={{ color: "#475569", display: "block", marginTop: "4px" }}>Boş bırakılırsa başlıktan otomatik üretilir</small>}

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>Oynatma Listesi (YouTube Playlist URL)</label>
              <input 
                value={playlist} 
                onChange={(e) => setPlaylist(e.target.value)} 
                placeholder="https://youtube.com/playlist?list=..." 
              />
              <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "4px" }}>Kampın tüm videolarını içeren genel liste linki.</p>
            </div>
          </div>

          <div className="info-card">
            <div className="card-title"><span className="ms">link</span> İlişkiler</div>

            {/* Reusable row-list renderer */}
            {(
              [
                { label: "BRANŞ", items: subjects, sel: subjectId ? [subjectId] : [], setSel: (id: string) => setSubjectId(id === subjectId ? "" : id), nameKey: "name", accent: "#a78bfa", accentBg: "rgba(167,139,250,0.12)", accentBorder: "rgba(167,139,250,0.25)", isSingle: true },
                { label: "KATEGORİLER", items: categories, sel: selCats, setSel: setSelCats, nameKey: "name", accent: "#60a5fa", accentBg: "rgba(59,130,246,0.12)", accentBorder: "rgba(59,130,246,0.25)" },
                { label: "EĞİTİMCİLER", items: instructors, sel: selIns, setSel: setSelIns, nameKey: "name", accent: "#34d399", accentBg: "rgba(16,185,129,0.12)", accentBorder: "rgba(16,185,129,0.25)" },
                { label: "KİTAPLAR", items: books, sel: selBooks, setSel: setSelBooks, nameKey: "title", accent: "#fbbf24", accentBg: "rgba(245,158,11,0.10)", accentBorder: "rgba(245,158,11,0.25)" },
              ] as any
            ).map(({ label, items, sel, setSel, nameKey, accent, accentBg, accentBorder, isSingle }: any, gi: number) => (
              <div key={gi} className="form-group" style={{ marginBottom: gi === 3 ? 0 : "24px" }}>
                <label style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  color: "#94a3b8",
                  fontWeight: 800,
                  marginBottom: "8px"
                }}>
                  <span>{label}</span>
                  {sel.length > 0 && (
                    <span style={{ background: accentBg, color: accent, borderRadius: "50px", padding: "1px 12px", fontSize: "0.65rem", fontWeight: 800, border: `1px solid ${accentBorder}` }}>
                      {isSingle ? "SEÇİLDİ" : `${sel.length} SEÇİLİ`}
                    </span>
                  )}
                </label>
                <div style={{
                  maxHeight: "180px", overflowY: "auto",
                  border: `1.5px solid ${sel.length > 0 ? accentBorder : "#1a2536"}`, 
                  borderRadius: "12px",
                  background: "#060d1a",
                  transition: "all 0.3s ease",
                  boxShadow: sel.length > 0 ? `0 4px 12px ${accentBg}` : "none"
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
                        onClick={() => isSingle ? setSel(id) : toggleMulti(id, sel as string[], setSel as any)}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          width: "100%", padding: "11px 16px",
                          background: selected ? accentBg : "transparent",
                          color: selected ? accent : "#94a3b8",
                          border: "none",
                          borderBottom: isLast ? "none" : "1px solid #111d2e",
                          cursor: "pointer", fontFamily: "inherit",
                          fontSize: "0.85rem", fontWeight: selected ? 600 : 400,
                          textAlign: "left",
                          transition: "all 0.15s",
                        }}
                      >
                        {/* Toggle indicator */}
                        <span style={{
                          width: "18px", height: "18px", borderRadius: isSingle ? "50%" : "5px", flexShrink: 0,
                          border: selected ? `2px solid ${accent}` : "2px solid #243249",
                          background: selected ? accent : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}>
                          {selected && <span className="ms" style={{ fontSize: "14px", color: "#060d1a", fontWeight: "bold" }}>{isSingle ? "radio_button_checked" : "check"}</span>}
                        </span>
                        <span style={{ flex: 1 }}>{name}</span>
                        {selected && (
                          <span className="ms" style={{ fontSize: "16px", color: accent, opacity: 0.5 }}>{isSingle ? "verified" : "done_all"}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ Kolon */}
        <div>
          <div className="info-card" style={{ marginBottom: "20px", border: "1px solid rgba(59, 130, 246, 0.2)", background: "rgba(6, 13, 26, 0.4)" }}>
            <div className="card-title"><span className="ms">palette</span> Kamp Tasarımı</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>LİSTELEME MODU</label>
                <select 
                  value={displayType} 
                  onChange={(e) => setDisplayType(e.target.value as any)}
                  style={{ width: "100%", background: "#0b1628", border: "1.5px solid #1e3a5f", borderRadius: "8px", color: "#e2e8f0", padding: "12px", outline: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  <option value="daily">📅 Günlük Program (1. Gün, 2. Gün...)</option>
                  <option value="topic">📖 Konu Bazlı (1. Konu, 2. Konu...)</option>
                  <option value="sequential">▶ Sıralı Liste (Ders 01, Ders 02...)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>TANITIM ALANI MODU</label>
                <select 
                  value={heroMode} 
                  onChange={(e) => setHeroMode(e.target.value as any)}
                  style={{ width: "100%", background: "#060d1a", border: "1.5px solid #3b82f6", color: "#fff", borderRadius: "8px", padding: "12px", fontWeight: 700, outline: "none", boxShadow: "0 0 10px rgba(59, 130, 246, 0.1)" }}
                >
                  <option value="video">🎥 Video Tanıtımı (YouTube'dan çeker)</option>
                  <option value="image">🖼️ Görsel Tanıtımı (Sadece resim yüklenir)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #1a2536" }}>
              {heroMode === "video" ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tanıtım Videosu URL</label>
                  <input value={introVideo} onChange={(e) => setIntroVideo(e.target.value)} placeholder="https://youtu.be/..." />
                  <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "4px" }}>Tanıtım alanında oynatılacak video linki.</p>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Kapak Görseli</label>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ width: "80px", height: "50px", background: "#0f172a", border: "1.5px dashed #1e3a5f", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {previewUrl ? (
                        <img 
                          src={previewUrl.startsWith("http") || previewUrl.startsWith("blob") ? previewUrl : `${process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340"}${previewUrl}`} 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        />
                      ) : (
                        <span className="ms" style={{ fontSize: "1.2rem", opacity: 0.2 }}>image</span>
                      )}
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                      <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, borderStyle: "solid", borderColor: "#1e3a5f" }}>
                        <span className="ms">add_a_photo</span> {previewUrl ? "Görseli Değiştir" : "Görsel Seç"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dersler */}
          <div className="info-card">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDrop}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
              <div className="card-title" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="ms">video_library</span> Ders Listesi ({lessons.length})
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowFormatTip(!showFormatTip)} onMouseEnter={() => setShowFormatTip(true)} onMouseLeave={() => setShowFormatTip(false)}>
                    <span className="ms">help_outline</span> Şablon
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
                    </div>
                  )}
                </div>
                <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCsvFile} style={{ display: "none" }} />
                <button className="btn btn-ghost btn-sm" onClick={() => csvInputRef.current?.click()} disabled={saving}>
                  <span className="ms">upload_file</span> CSV Yükle
                </button>
                {displayType === "sequential" ? (
                  <button className="btn btn-primary btn-sm" onClick={addLessonDirectly}>
                    <span className="ms">add</span> Ders Ekle
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={addDay}>
                    <span className="ms">create_new_folder</span> {typeLabel} Ekle
                  </button>
                )}
              </div>
            </div>

            {lessons.length === 0 && (
              <div className="empty-state">
                <span className="ms">event_note</span>
                Henüz ders eklenmemiş.
                <br />
                <button className="btn btn-primary" style={{ marginTop: "16px" }} onClick={displayType === "sequential" ? addLessonDirectly : addDay}>
                  <span className="ms">add</span> {displayType === "sequential" ? "İlk Dersi Ekle" : `İlk ${typeLabel}'ü Oluştur`}
                </button>
              </div>
            )}

            {displayType === "sequential" ? (
              <SortableContext items={lessons.map(l => l.id as string)} strategy={verticalListSortingStrategy}>
                <div style={{ padding: "0 4px" }}>
                  {lessons.map((l, index) => (
                    <SortableLessonRow 
                      key={l.id} 
                      lesson={l} 
                      index={index + 1}
                      updateLesson={updateLesson} 
                      removeLesson={removeLesson}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <SortableContext items={sortedDayNumbers.map(d => `day-${d}`)} strategy={verticalListSortingStrategy}>
                {sortedDayNumbers.map((dayNum) => (
                  <SortableDayGroup 
                    key={dayNum} 
                    dayNum={dayNum} 
                    dayLessons={dayGroups[dayNum]} 
                    isOpen={openDays.has(dayNum)} 
                    toggleDay={toggleDay} 
                    removeDay={removeDay}
                    addLessonToDay={addLessonToDay}
                    updateLesson={updateLesson}
                    removeLesson={removeLesson}
                    updateGroupTitle={updateGroupTitle}
                    saving={saving}
                    displayType={displayType}
                  />
                ))}
              </SortableContext>
            )}
            
            {lessons.length > 0 && (
              <div style={{ marginTop: "16px", padding: "0 4px" }}>
                <button 
                  type="button" 
                  className="btn btn-primary btn-lg" 
                  onClick={displayType === "sequential" ? addLessonDirectly : addDay}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px" }}
                >
                  <span className="ms">add_circle</span> {displayType === "sequential" ? "Yeni Ders Ekle" : `Yeni ${typeLabel} Ekle`}
                </button>
              </div>
            )}
          </DndContext>
        </div>
      </div>
    </div>

      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/admin/kamplar")}>◀ İptal</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
        </button>
      </div>

    </>
  );
}

// ── Sortable Day Group Component ─────────────────────────────
function SortableDayGroup({ dayNum, dayLessons, isOpen, toggleDay, removeDay, addLessonToDay, updateLesson, removeLesson, updateGroupTitle, saving, displayType }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `day-${dayNum}` });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 10 : 1 };

  const label = displayType === "daily" ? "Gün" : displayType === "topic" ? "Konu" : "Bölüm";
  const groupTitle = dayLessons?.[0]?.group_title || "";

  return (
    <div ref={setNodeRef} style={style} className="day-card">
      <div className="day-header" onClick={() => toggleDay(dayNum)}>
        <span className="ms" style={{ color: "#2d4a6e", fontSize: "20px", cursor: "grab" }} {...attributes} {...listeners} onClick={e => e.stopPropagation()}>drag_indicator</span>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }} onClick={e => e.stopPropagation()}>
          <span style={{ color: "#60a5fa", fontWeight: 800, fontSize: "0.95rem", whiteSpace: "nowrap" }}>{dayNum}. {label}:</span>
          <input 
            value={groupTitle}
            placeholder={`${label} Başlığı (Opsiyonel)`}
            onChange={(e) => updateGroupTitle(dayNum, e.target.value)}
            style={{ 
              background: "transparent", 
              border: "none", 
              borderBottom: "1.5px solid #1e3a5f", 
              color: "#fff", 
              fontSize: "0.9rem", 
              fontWeight: 600, 
              padding: "2px 4px",
              width: "100%",
              outline: "none"
            }}
          />
        </div>

        <span style={{ color: "#475569", fontSize: "0.75rem", fontWeight: 500, marginLeft: "12px", whiteSpace: "nowrap" }}>{dayLessons?.length || 0} Ders</span>
        
        <div style={{ display: "flex", gap: "8px" }} onClick={e => e.stopPropagation()}>
          <button type="button" className="btn btn-success btn-sm" onClick={() => addLessonToDay(dayNum)} style={{ padding: "4px 12px !important", fontSize: "0.72rem", fontWeight: 700 }}>+ Ders Ekle</button>
          <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeDay(dayNum)}><span className="ms">delete</span></button>
        </div>
        <span className="ms" style={{ color: "#3b82f6", transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)", transform: isOpen ? "rotate(90deg)" : "none", marginLeft: "8px" }}>chevron_right</span>
      </div>

      {isOpen && (
        <div className="day-body">
          <SortableContext items={(dayLessons || []).map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
            {(dayLessons || []).map((l: any, idx: number) => (
              <SortableLessonRow 
                key={l.id} 
                lesson={l} 
                index={idx + 1}
                updateLesson={updateLesson} 
                removeLesson={removeLesson}
              />
            ))}
          </SortableContext>
          
          <button type="button" className="btn btn-ghost btn-sm" 
            style={{ width: "100%", marginTop: "8px", border: "1.5px dashed #1e3a5f", color: "#60a5fa", background: "rgba(59,130,246,0.03) !important" }} 
            onClick={() => addLessonToDay(dayNum)}>
            <span className="ms">add_circle</span> Yeni Ders Ekle
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sortable Lesson Row Component ────────────────────────────
function SortableLessonRow({ lesson, index, updateLesson, removeLesson }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const [expanded, setExpanded] = useState(false);
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 20 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`lesson-row-card ${expanded ? 'is-expanded' : ''}`}>
      <div className="lesson-row-header" onClick={() => setExpanded(!expanded)}>
        <span className="ms drag-handle" style={{ color: "#2d4a6e", fontSize: "18px", cursor: "grab" }} {...attributes} {...listeners} onClick={e => e.stopPropagation()}>drag_indicator</span>
        <span style={{ 
          background: "#1e293b", 
          color: "#60a5fa", 
          fontSize: "0.7rem", 
          fontWeight: 800, 
          padding: "2px 6px", 
          borderRadius: "4px",
          marginRight: "4px"
        }}>
          {String(index).padStart(2, '0')}
        </span>
        <span className="lesson-title-preview" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>{lesson.title || "Başlıksız Ders"}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={e => e.stopPropagation()}>
          <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeLesson(lesson.id)} style={{ padding: "4px !important", opacity: 0.6 }}>
            <span className="ms" style={{ fontSize: "16px" }}>delete</span>
          </button>
          <span className="ms expand-icon" style={{ 
            color: "#60a5fa", 
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
            transform: expanded ? "rotate(90deg)" : "none" 
          }}>chevron_right</span>
        </div>
      </div>

      {expanded && (
        <div className="lesson-row-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ders Başlığı</label>
              <input 
                className="lesson-input"
                value={lesson.title} 
                onChange={e => updateLesson(lesson.id, "title", e.target.value)} 
                placeholder="Örn: 9. Sınıf Biyoloji - Hücre Bölünmesi"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>YouTube URL / ID</label>
              <input 
                className="lesson-input vid"
                value={lesson.youtube} 
                onChange={e => updateLesson(lesson.id, "youtube", e.target.value)} 
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ders Notu (PDF/Drive Linki)</label>
              <input 
                className="lesson-input note"
                value={lesson.notes_link} 
                onChange={e => updateLesson(lesson.id, "notes_link", e.target.value)} 
                placeholder="Drive veya PDF döküman linkini buraya yapıştırın"
              />
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

