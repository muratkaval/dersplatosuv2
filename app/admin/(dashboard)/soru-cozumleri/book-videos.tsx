"use client";

import React, { useState, useCallback, useRef } from "react";
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
import { toMediaUrl } from "@/app/lib/strapi";

type Video = {
  documentId: string;
  id: number;
  baslik: string;
  youtube_id: string;
  sira: number;
  bolum_adi: string;
  bolum_no: number;
};

type Chapter = {
  name: string;
  no: number;
  videos: Video[];
};

function extractYtId(input: string): string {
  if (!input) return "";
  const clean = input.trim();
  // If it's exactly 11 valid characters, assume it's already an ID
  if (/^[A-Za-z0-9_-]{11}$/.test(clean)) return clean;
  // Robust YouTube URL regex for all formats (watch, embed, short, live, youtu.be, etc.)
  const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : clean;
}

export default function BookVideos({
  book,
  videos: initialVideos,
  selectedBook,
}: {
  book: any;
  videos: Video[];
  selectedBook: string;
}) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Chapter-level state
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editChapterName, setEditChapterName] = useState("");
  const [addTestChapter, setAddTestChapter] = useState<string | null>(null);
  const [newTestTitle, setNewTestTitle] = useState("");
  const [newTestYt, setNewTestYt] = useState("");

  // New chapter state: null = hidden, number = insert after this index (chapters.length = at end)
  const [addChapterAfterIdx, setAddChapterAfterIdx] = useState<number | null>(null);
  const [newChapterName, setNewChapterName] = useState("");
  const [hoveredDivider, setHoveredDivider] = useState<number | null>(null);
  const [showFormatTip, setShowFormatTip] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Editing a specific video
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editVideoData, setEditVideoData] = useState({ baslik: "", youtube_id: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── CSV Import Logic ──────────────────────────────────────────
  function downloadCsvTemplate() {
    const header = "Bolum Adi,Test Adi,YouTube URL veya ID";
    const example = "Uslu Sayilar,Test 1,https://youtu.be/xyz123\nUslu Sayilar,Test 2,xyz456";
    const blob = new Blob([`${header}\n${example}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video_cozumleri_sablon.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const rows = clean.split("\n").map(r => r.trim()).filter(Boolean);
        if (rows.length < 2) { showToast("CSV dosyası boş veya hatalı", "error"); return; }

        const sep = rows[0].includes(";") ? ";" : ",";
        const headers = rows[0].split(sep).map(h => h.trim().toLowerCase());
        
        const col = (candidates: string[]) => {
          for (const c of candidates) {
            const idx = headers.findIndex(h => h.includes(c));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const iChapter = col(["bolum", "chapter", "konu"]);
        const iTitle = col(["test", "baslik", "title", "video"]);
        const iYt = col(["youtube", "yt", "url", "id"]);

        if (iChapter === -1 || iTitle === -1) {
          showToast("'Bölüm' ve 'Test' kolonları bulunamadı", "error"); return;
        }

        const dataRows = rows.slice(1);
        showToast(`${dataRows.length} satır işleniyor...`);

        // Group videos by chapter for proper bolum_no and sira management
        const importGroups: Record<string, { baslik: string, yt: string }[]> = {};
        dataRows.forEach(row => {
          const cols = row.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
          const chName = cols[iChapter];
          if (!chName) return;
          if (!importGroups[chName]) importGroups[chName] = [];
          importGroups[chName].push({
            baslik: cols[iTitle] || "İsimsiz Test",
            yt: iYt !== -1 ? cols[iYt] : ""
          });
        });

        const newVids: Video[] = [];
        const currentChapters = [...chapters];
        let maxChapterNo = currentChapters.reduce((max, c) => Math.max(max, c.no), 0);

        for (const [chName, tests] of Object.entries(importGroups)) {
          let ch = currentChapters.find(c => c.name.toLocaleLowerCase() === chName.toLocaleLowerCase());
          let chNo = ch ? ch.no : ++maxChapterNo;
          let currentSira = ch ? ch.videos.length : 0;

          for (const t of tests) {
            const res = await apiCall("/api/admin/solution-videos", "POST", {
              baslik: t.baslik,
              youtube_id: extractYtId(t.yt),
              sira: ++currentSira,
              bolum_adi: ch ? ch.name : chName, // Use existing capitalization or new
              bolum_no: chNo,
              book: selectedBook,
            });
            const resData = await res.json();
            if (res.ok) {
              const created = resData.data || resData;
              newVids.push({ ...created, bolum_adi: ch ? ch.name : chName, bolum_no: chNo });
            }
          }
        }

        setVideos(prev => [...prev, ...newVids]);
        showToast("İçe aktarma tamamlandı ✓");
      } catch (err) {
        showToast("Hata oluştu", "error");
      } finally {
        setSaving(false);
        if (csvInputRef.current) csvInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  // Build chapters from flat videos
  const chapters: Chapter[] = [];
  const chapterMap: Record<string, Chapter> = {};
  videos.forEach((v) => {
    if (!chapterMap[v.bolum_adi]) {
      chapterMap[v.bolum_adi] = { name: v.bolum_adi, no: v.bolum_no, videos: [] };
      chapters.push(chapterMap[v.bolum_adi]);
    }
    chapterMap[v.bolum_adi].videos.push(v);
  });
  chapters.sort((a, b) => a.no - b.no);
  chapters.forEach((ch) => ch.videos.sort((a, b) => a.sira - b.sira));

  function toggleChapter(name: string) {
    setOpenChapters((prev) => {
      const s = new Set(prev);
      s.has(name) ? s.delete(name) : s.add(name);
      return s;
    });
  }

  async function apiCall(url: string, method: string, body?: any) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res;
  }

  // ── Add test ──────────────────────────────────────────────────
  async function handleAddTest(chapterName: string) {
    if (!newTestTitle.trim()) return;
    const ch = chapterMap[chapterName];
    const nextSira = ch.videos.length + 1;
    setSaving(true);
    try {
      const res = await apiCall("/api/admin/solution-videos", "POST", {
        baslik: newTestTitle.trim(),
        youtube_id: extractYtId(newTestYt),
        sira: nextSira,
        bolum_adi: chapterName,
        bolum_no: ch.no,
        book: selectedBook,
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Hata", "error"); return; }
      const newVid = data.data || data;
      setVideos((prev) => [...prev, { ...newVid, bolum_adi: chapterName, bolum_no: ch.no }]);
      setAddTestChapter(null);
      setNewTestTitle(""); setNewTestYt("");
      showToast("Test eklendi ✓");
    } finally { setSaving(false); }
  }

  // ── Delete video ──────────────────────────────────────────────
  async function handleDeleteVideo(docId: string) {
    if (!confirm("Bu testi silmek istediğinize emin misiniz?")) return;
    const res = await apiCall(`/api/admin/solution-videos/${docId}`, "DELETE");
    if (res.ok) {
      setVideos((prev) => prev.filter((v) => v.documentId !== docId));
      showToast("Test silindi");
    } else { showToast("Silinemedi", "error"); }
  }

  // ── Delete chapter (all videos in it) ────────────────────────
  async function handleDeleteChapter(chName: string) {
    const ch = chapterMap[chName];
    if (!confirm(`"${chName}" bölümü ve ${ch.videos.length} testi silinecek. Emin misiniz?`)) return;
    for (const v of ch.videos) {
      await apiCall(`/api/admin/solution-videos/${v.documentId}`, "DELETE");
    }
    setVideos((prev) => prev.filter((v) => v.bolum_adi !== chName));
    showToast("Bölüm silindi");
  }

  // ── Rename chapter ────────────────────────────────────────────
  async function handleRenameChapter(oldName: string) {
    const ch = chapterMap[oldName];
    if (!editChapterName.trim()) return;
    setSaving(true);
    try {
      for (const v of ch.videos) {
        await apiCall(`/api/admin/solution-videos/${v.documentId}`, "PUT", { bolum_adi: editChapterName.trim() });
      }
      setVideos((prev) =>
        prev.map((v) => v.bolum_adi === oldName ? { ...v, bolum_adi: editChapterName.trim() } : v)
      );
      setEditingChapter(null);
      showToast("Bölüm adı güncellendi ✓");
    } finally { setSaving(false); }
  }

  // ── Add chapter ───────────────────────────────────────────────
  async function handleAddChapter() {
    if (!newChapterName.trim() || addChapterAfterIdx === null) return;
    // Calculate bolum_no to insert between existing chapters
    const prevNo = chapters[addChapterAfterIdx - 1]?.no ?? 0;
    const nextNo = chapters[addChapterAfterIdx]?.no ?? (chapters.length + 1);
    const newNo = addChapterAfterIdx >= chapters.length
      ? chapters.length + 1          // append at end
      : (prevNo + nextNo) / 2;       // insert between
    setSaving(true);
    try {
      const res = await apiCall("/api/admin/solution-videos", "POST", {
        baslik: "Test 1",
        youtube_id: "",
        sira: 1,
        bolum_adi: newChapterName.trim(),
        bolum_no: newNo,
        book: selectedBook,
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Hata", "error"); return; }
      const newVid = data.data || data;
      setVideos((prev) => [...prev, { ...newVid, bolum_adi: newChapterName.trim(), bolum_no: newNo }]);
      setAddChapterAfterIdx(null);
      setNewChapterName("");
      setOpenChapters((prev) => new Set([...prev, newChapterName.trim()]));
      showToast("Bölüm eklendi ✓");
    } finally { setSaving(false); }
  }

  // ── Edit video ────────────────────────────────────────────────
  async function handleSaveVideo(docId: string) {
    setSaving(true);
    try {
      const res = await apiCall(`/api/admin/solution-videos/${docId}`, "PUT", {
        baslik: editVideoData.baslik,
        youtube_id: extractYtId(editVideoData.youtube_id),
      });
      if (!res.ok) { showToast("Güncelleme hatası", "error"); return; }
      setVideos((prev) =>
        prev.map((v) =>
          v.documentId === docId
            ? { ...v, baslik: editVideoData.baslik, youtube_id: extractYtId(editVideoData.youtube_id) }
            : v
        )
      );
      setEditingVideoId(null);
      showToast("Güncellendi ✓");
    } finally { setSaving(false); }
  }

  // ── Drag and Drop Handlers ─────────────────────────────────────
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we are dragging a chapter or a video
    const isChapterDrag = activeId.startsWith("chap-");

    if (isChapterDrag) {
      const oldIndex = chapters.findIndex(c => `chap-${c.name}` === activeId);
      const newIndex = chapters.findIndex(c => `chap-${c.name}` === overId);
      
      const newChapters = arrayMove(chapters, oldIndex, newIndex);
      
      // Update local state by recalculating all bolum_no
      const updatedVideos = [...videos];
      newChapters.forEach((ch, idx) => {
        const newNo = idx + 1;
        ch.videos.forEach(v => {
          const found = updatedVideos.find(uv => uv.documentId === v.documentId);
          if (found) found.bolum_no = newNo;
        });
      });
      setVideos(updatedVideos);

      // Sync with Strapi
      showToast("Sıralama güncelleniyor...", "success");
      try {
        for (const ch of newChapters) {
          const newNo = newChapters.indexOf(ch) + 1;
          for (const v of ch.videos) {
            await apiCall(`/api/admin/solution-videos/${v.documentId}`, "PUT", { bolum_no: newNo });
          }
        }
        showToast("Bölüm sıralaması güncellendi ✓");
      } catch (err) {
        showToast("API hatası", "error");
      }
    } else {
      // Video drag
      const oldIndex = videos.findIndex(v => v.documentId === activeId);
      const newIndex = videos.findIndex(v => v.documentId === overId);
      
      // Ensure they are in the same chapter (for now)
      if (videos[oldIndex].bolum_adi !== videos[newIndex].bolum_adi) return;

      const newVideos = arrayMove(videos, oldIndex, newIndex);
      
      // Update sira within that chapter
      const chapterName = videos[oldIndex].bolum_adi;
      const chapterVideos = newVideos.filter(v => v.bolum_adi === chapterName);
      chapterVideos.forEach((v, idx) => {
        const found = newVideos.find(nv => nv.documentId === v.documentId);
        if (found) found.sira = idx + 1;
      });
      
      setVideos(newVideos);

      // Sync with Strapi
      showToast("Sıralama güncelleniyor...", "success");
      try {
        for (const v of chapterVideos) {
          await apiCall(`/api/admin/solution-videos/${v.documentId}`, "PUT", { sira: chapterVideos.indexOf(v) + 1 });
        }
        showToast("Video sıralaması güncellendi ✓");
      } catch (err) {
        showToast("API hatası", "error");
      }
    }
  }

  const coverUrl = toMediaUrl(book?.cover);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      {/* Book header */}
      <div className="info-card" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px", overflow: "visible" }}>
        {coverUrl && (
          <img src={coverUrl} alt={book.title}
            style={{ width: "56px", height: "78px", objectFit: "cover", borderRadius: "6px", flexShrink: 0, border: "2px solid #1e3a5f" }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.72rem", color: "#475569", marginBottom: "4px" }}>Seçili Kitap</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0" }}>{book?.title}</div>
          <div style={{ fontSize: "0.78rem", color: "#60a5fa", marginTop: "4px" }}>
            {chapters.length} bölüm · {videos.length} video
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ position: "relative" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowFormatTip(!showFormatTip)}>
              <span className="ms">help_outline</span> Şablon
            </button>
            {showFormatTip && (
              <>
                <div 
                  style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
                  onClick={() => setShowFormatTip(false)} 
                />
                <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 100, background: "#0d1a2e", border: "1px solid #1a2e47", borderRadius: "12px", padding: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", width: "300px", marginTop: "10px" }}>
                  <div style={{ color: "#60a5fa", fontWeight: 700, marginBottom: "8px", fontSize: "0.85rem" }}>📄 CSV Formatı Nasıl Olmalı?</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.5 }}>
                    Dosyada en az şu üç kolon bulunmalıdır:<br/>
                    <b>"Bölüm Adı", "Test Adı", "YouTube ID/URL"</b><br/><br/>
                    Virgül (,) veya noktalı virgül (;) ayırıcı olarak kullanılabilir. Üst üste aynı bölüm adlarını yazarsanız hepsi o bölümün altına eklenir.
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ width: "100%", marginTop: "12px" }} onClick={downloadCsvTemplate}>
                    <span className="ms">download</span> Şablonu İndir
                  </button>
                </div>
              </>
            )}
          </div>
          <input type="file" ref={csvInputRef} accept=".csv" onChange={handleCsvFile} style={{ display: "none" }} />
          <button className="btn btn-ghost btn-sm" onClick={() => csvInputRef.current?.click()} disabled={saving}>
            <span className="ms">upload_file</span> CSV'den Yükle
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setAddChapterAfterIdx(chapters.length)}>
            <span className="ms">create_new_folder</span> Bölüm Ekle
          </button>
        </div>
      </div>

      {/* Empty state */}
      {chapters.length === 0 && addChapterAfterIdx === null && (
        <div className="empty-state">
          <span className="ms">play_circle</span>
          Bu kitap için henüz bölüm eklenmemiş
          <br />
          <button className="btn btn-primary" style={{ marginTop: "16px" }} onClick={() => setAddChapterAfterIdx(0)}>
            <span className="ms">add</span> İlk Bölümü Ekle
          </button>
        </div>
      )}

      {/* Chapters */}
      <SortableContext items={chapters.map(c => `chap-${c.name}`)} strategy={verticalListSortingStrategy}>
        {chapters.map((ch, ci) => {
          const isOpen = openChapters.has(ch.name);
          const isEditingCh = editingChapter === ch.name;
          const isAddingTest = addTestChapter === ch.name;
          return <SortableChapterRow key={ch.name} {...{ ch, ci, isOpen, isEditingCh, isAddingTest, toggleChapter, editingChapter, setEditingChapter, editChapterName, setEditChapterName, handleRenameChapter, setAddTestChapter, setOpenChapters, handleDeleteChapter, videos, editingVideoId, setEditingVideoId, editVideoData, setEditVideoData, handleSaveVideo, handleDeleteVideo, saving, newTestTitle, setNewTestTitle, newTestYt, setNewTestYt, handleAddTest, addChapterAfterIdx, setAddChapterAfterIdx, hoveredDivider, setHoveredDivider, handleAddChapter, newChapterName, setNewChapterName, chapters }} />;
        })}
      </SortableContext>

      {/* Inline form — only for first chapter or append-at-end case */}
      {(addChapterAfterIdx === chapters.length || (addChapterAfterIdx === 0 && chapters.length === 0)) && (
        <div style={{
          border: "1.5px dashed #3b82f6", borderRadius: "12px",
          padding: "16px", marginTop: "4px",
          background: "rgba(59,130,246,0.05)",
        }}>
          <div style={{ color: "#60a5fa", fontWeight: 700, marginBottom: "12px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="ms" style={{ fontSize: "16px" }}>create_new_folder</span> 
            {chapters.length === 0 ? "İlk bölümü ekle" : "Sona yeni bölüm ekle"}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", fontSize: "0.7rem", color: "#475569", marginBottom: "6px", fontWeight: 700 }}>BÖLÜM ADI</label>
            <input
              value={newChapterName}
              onChange={(e) => setNewChapterName(e.target.value)}
              placeholder="Örn: Oran Orantı"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
              style={{ background: "#0b1628", border: "1.5px solid #1e3a5f", borderRadius: "8px", color: "#e2e8f0", fontFamily: "inherit", padding: "9px 12px", width: "100%", boxSizing: "border-box", outline: "none", fontSize: "0.9rem" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setAddChapterAfterIdx(null); setNewChapterName(""); }}>İptal</button>
            <button className="btn btn-primary btn-sm" onClick={handleAddChapter} disabled={saving || !newChapterName.trim()}>
              <span className="ms">save</span> Ekle
            </button>
          </div>
        </div>
      )}

      {/* Bottom add chapter button */}
      {chapters.length > 0 && addChapterAfterIdx === null && (
        <button className="btn btn-ghost" style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}
          onClick={() => setAddChapterAfterIdx(chapters.length)}>
          <span className="ms">create_new_folder</span> Yeni Bölüm Ekle
        </button>
      )}
        </div>
      </DndContext>
    );
}

// ── Sortable Components ──────────────────────────────────────────

function SortableChapterRow({ ch, ci, isOpen, isEditingCh, isAddingTest, toggleChapter, editingChapter, setEditingChapter, editChapterName, setEditChapterName, handleRenameChapter, setAddTestChapter, setOpenChapters, handleDeleteChapter, videos, editingVideoId, setEditingVideoId, editVideoData, setEditVideoData, handleSaveVideo, handleDeleteVideo, saving, newTestTitle, setNewTestTitle, newTestYt, setNewTestYt, handleAddTest, addChapterAfterIdx, setAddChapterAfterIdx, hoveredDivider, setHoveredDivider, handleAddChapter, newChapterName, setNewChapterName, chapters }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `chap-${ch.name}` });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 1000 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <React.Fragment>
        <div style={{ marginBottom: "2px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "#0d1a2e", border: "1px solid #1a2e47",
            borderRadius: isOpen ? "12px 12px 0 0" : "12px",
            padding: "12px 16px", cursor: isEditingCh ? "default" : "pointer",
            transition: "border-color 0.15s",
          }} onClick={() => !isEditingCh && toggleChapter(ch.name)}>
            
            <span className="ms" style={{ color: "#2d4a6e", fontSize: "20px", cursor: "grab", flexShrink: 0 }}
              {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>drag_indicator</span>

            <span style={{ color: "#60a5fa", fontWeight: 800, fontSize: "0.9rem", flexShrink: 0, minWidth: "28px" }}>{ci + 1}.</span>

            {isEditingCh ? (
              <input value={editChapterName} onChange={(e) => setEditChapterName(e.target.value)} onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => { if (e.key === "Enter") handleRenameChapter(ch.name); if (e.key === "Escape") setEditingChapter(null); }}
                style={{ flex: 1, fontSize: "0.9rem", fontWeight: 700, background: "#0b1628", border: "1.5px solid #1e3a5f", borderRadius: "8px", color: "#e2e8f0", padding: "6px 12px", outline: "none", fontFamily: "inherit" }}
                autoFocus />
            ) : (
              <span style={{ flex: 1, fontWeight: 700, color: "#e2e8f0", fontSize: "0.9rem" }}>{ch.name}</span>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              {!isEditingCh && (
                <>
                  <span style={{ color: "#475569", fontSize: "0.75rem", whiteSpace: "nowrap" }}>{ch.videos.length} test</span>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingChapter(ch.name); setEditChapterName(ch.name); }}><span className="ms">edit</span></button>
                  <button className="btn btn-success btn-sm" style={{ fontSize: "0.75rem", padding: "4px 10px" }} onClick={() => { setAddTestChapter(ch.name); setOpenChapters((p: any) => new Set([...Array.from(p), ch.name])); }}>+ Test</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteChapter(ch.name)}><span className="ms">delete</span></button>
                  <button className={`btn btn-sm btn-icon ${isOpen ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleChapter(ch.name)}>
                    <span className="ms" style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "none" }}>chevron_right</span>
                  </button>
                </>
              )}
              {isEditingCh && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={() => handleRenameChapter(ch.name)}><span className="ms">save</span> Kaydet</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingChapter(null)}>İptal</button>
                </>
              )}
            </div>
          </div>

          {isOpen && (
            <div style={{ border: "1px solid #1a2e47", borderTop: "none", borderRadius: "0 0 12px 12px", background: "#060e1a", overflow: "hidden" }}>
              <SortableContext items={ch.videos.map((v: any) => v.documentId)} strategy={verticalListSortingStrategy}>
                {ch.videos.map((v: any, vi: number) => (
                  <SortableVideoRow key={v.documentId} {...{ v, vi, ch, editingVideoId, setEditingVideoId, editVideoData, setEditVideoData, handleSaveVideo, handleDeleteVideo, saving, isLast: vi === ch.videos.length - 1 && !isAddingTest }} />
                ))}
              </SortableContext>

              {isAddingTest && (
                <div style={{ padding: "16px 16px 16px 32px", borderTop: ch.videos.length > 0 ? "1px solid #111d2e" : "none", background: "rgba(59,130,246,0.04)" }}>
                  <div style={{ color: "#60a5fa", fontWeight: 700, marginBottom: "12px", fontSize: "0.82rem" }}>+ Yeni Test</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>TEST ADI</label><input value={newTestTitle} onChange={(e) => setNewTestTitle(e.target.value)} placeholder={`Test ${ch.videos.length + 1}`} autoFocus /></div>
                    <div className="form-group" style={{ marginBottom: 0 }}><label>YOUTUBE URL / ID</label><input value={newTestYt} onChange={(e) => setNewTestYt(e.target.value)} placeholder="https://youtu.be/..." /></div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setAddTestChapter(null); setNewTestTitle(""); setNewTestYt(""); }}>İptal</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAddTest(ch.name)} disabled={saving || !newTestTitle.trim()}><span className="ms">save</span> Ekle</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ minHeight: "20px", position: "relative", display: "flex", flexDirection: "column", marginBottom: "2px" }} 
             onMouseEnter={() => setHoveredDivider(`test-${ci}`)} onMouseLeave={() => setHoveredDivider(null)}>
          {hoveredDivider === `test-${ci}` && isOpen ? (
            <div style={{ display: "flex", alignItems: "center", height: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(16,185,129,0.3)" }} />
              <button type="button" onClick={(e) => { 
                e.stopPropagation(); 
                setHoveredDivider(null);
                setAddTestChapter(ch.name);
                setOpenChapters((p: any) => new Set([...Array.from(p), ch.name]));
              }}
                style={{ all: "unset", cursor: "pointer", background: "#10b981", color: "#fff", borderRadius: "50px", padding: "2px 12px", fontSize: "0.72rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", margin: "0 8px", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }}>
                <span className="ms" style={{ fontSize: "14px" }}>add</span> Bu bölüme test ekle
              </button>
              <div style={{ flex: 1, height: "1px", background: "rgba(16,185,129,0.3)" }} />
            </div>
          ) : null}
        </div>
      </React.Fragment>
    </div>
  );
}

function SortableVideoRow({ v, vi, ch, editingVideoId, setEditingVideoId, editVideoData, setEditVideoData, handleSaveVideo, handleDeleteVideo, saving, isLast }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: v.documentId });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 1000 : 1 };
  const isEditV = editingVideoId === v.documentId;

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 16px 10px 32px",
        borderBottom: isLast ? "none" : "1px solid #111d2e",
        background: isEditV ? "rgba(59,130,246,0.05)" : "transparent",
      }}>
        <span className="ms" style={{ color: "#1e3a5f", fontSize: "18px", cursor: "grab", flexShrink: 0 }}
          {...attributes} {...listeners}>drag_indicator</span>
        <span className="ms" style={{ color: "#475569", fontSize: "16px", flexShrink: 0 }}>play_arrow</span>

        {isEditV ? (
          <div style={{ flex: 1, display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <input value={editVideoData.baslik} onChange={(e) => setEditVideoData((p: any) => ({ ...p, baslik: e.target.value }))} placeholder="Test adı"
              style={{ flex: 2, minWidth: "120px", fontSize: "0.82rem", padding: "7px 10px", background: "#0b1628", border: "1.5px solid #1e3a5f", borderRadius: "8px", color: "#e2e8f0", fontFamily: "inherit", outline: "none" }} />
            <input value={editVideoData.youtube_id} onChange={(e) => setEditVideoData((p: any) => ({ ...p, youtube_id: e.target.value }))} placeholder="YouTube ID / URL"
              style={{ flex: 2, minWidth: "120px", fontSize: "0.82rem", padding: "7px 10px", background: "#0b1628", border: "1.5px solid #1e3a5f", borderRadius: "8px", color: "#e2e8f0", fontFamily: "inherit", outline: "none" }} />
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <div style={{ color: "#cbd5e1", fontSize: "0.875rem", fontWeight: 600 }}>{v.baslik || "—"}</div>
            <div style={{ color: "#475569", fontSize: "0.72rem", marginTop: "2px" }}>
              {v.youtube_id && (
                <a href={`https://youtu.be/${v.youtube_id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>{v.youtube_id}</a>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {isEditV ? (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => handleSaveVideo(v.documentId)} disabled={saving}><span className="ms">save</span> Kaydet</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingVideoId(null)}>İptal</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingVideoId(v.documentId); setEditVideoData({ baslik: v.baslik, youtube_id: v.youtube_id }); }}>
                <span className="ms">edit</span>
              </button>
              <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteVideo(v.documentId)}>
                <span className="ms">delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
