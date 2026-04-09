"use client";

import { useState } from "react";
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
  const [lessons, setLessons] = useState<Lesson[]>((camp?.lessons || []).map((l: any) => ({ ...l })));
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
                <span style={{ color: "#64748b", fontSize: "0.82rem", whiteSpace: "nowrap" }}>dersplatosu.com/egitim/</span>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ flex: 1 }} placeholder="ornek-kamp-adi" />
              </div>
              <small>Boş bırakılırsa başlıktan otomatik üretilir</small>
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

            <div className="form-group">
              <label>Kategoriler</label>
              <div className="checkbox-list">
                {categories.map((c) => (
                  <label key={c.documentId || c.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selCats.includes(c.documentId || String(c.id))}
                      onChange={() => toggleMulti(c.documentId || String(c.id), selCats, setSelCats)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Eğitimciler</label>
              <div className="checkbox-list">
                {instructors.map((c) => (
                  <label key={c.documentId || c.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selIns.includes(c.documentId || String(c.id))}
                      onChange={() => toggleMulti(c.documentId || String(c.id), selIns, setSelIns)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Kitaplar</label>
              <div className="checkbox-list">
                {books.map((c) => (
                  <label key={c.documentId || c.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selBooks.includes(c.documentId || String(c.id))}
                      onChange={() => toggleMulti(c.documentId || String(c.id), selBooks, setSelBooks)}
                    />
                    {c.title}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Kolon - Dersler */}
        <div className="info-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              <span className="ms">video_library</span> Dersler ({lessons.length})
            </div>
            <button className="btn btn-success btn-sm" onClick={addLesson}>
              <span className="ms">add</span> Ders Ekle
            </button>
          </div>

          {lessons.length === 0 && (
            <p style={{ color: "#475569", fontSize: "0.82rem" }}>Henüz ders yok.</p>
          )}

          {lessons.map((l, i) => (
            <div key={i} style={{
              background: "#0b1221", border: "1px solid #1e3a5f",
              borderRadius: "10px", padding: "12px", marginBottom: "10px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ color: "#60a5fa", fontSize: "0.82rem" }}>Ders {i + 1}</strong>
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
