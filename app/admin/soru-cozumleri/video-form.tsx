"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  books: any[];
  video?: any;
  defaultBookId?: string;
}

export default function VideoForm({ books, video, defaultBookId }: Props) {
  const router = useRouter();
  const isEdit = !!video?.documentId;

  const [bookId, setBookId] = useState(video?.book?.documentId || defaultBookId || "");
  const [bolumAdi, setBolumAdi] = useState(video?.bolum_adi || "");
  const [bolumNo, setBolumNo] = useState(video?.bolum_no || 1);
  const [baslik, setBaslik] = useState(video?.baslik || "");
  const [youtubeId, setYoutubeId] = useState(video?.youtube_id || "");
  const [sira, setSira] = useState(video?.sira || 1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // YouTube ID / URL'den ID çıkartıcı
  function parseYtId(val: string) {
    const match = val.match(/(?:youtu\.be\/|youtube\.com\/(?:embed|v|shorts)\/|[?&]v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : val.trim();
  }

  async function handleSave() {
    if (!bookId) { showToast("Kitap seçimi zorunludur", "error"); return; }
    if (!baslik.trim()) { showToast("Başlık zorunludur", "error"); return; }
    if (!youtubeId.trim()) { showToast("YouTube ID zorunludur", "error"); return; }

    setSaving(true);
    try {
      const payload = {
        book: bookId,
        bolum_adi: bolumAdi,
        bolum_no: Number(bolumNo),
        baslik: baslik.trim(),
        youtube_id: parseYtId(youtubeId),
        sira: Number(sira),
      };

      const url = isEdit
        ? `/api/admin/solution-videos/${video.documentId}`
        : "/api/admin/solution-videos";
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

      showToast(isEdit ? "Video güncellendi ✓" : "Video eklendi ✓");
      setTimeout(() => router.push(`/admin/soru-cozumleri?book=${bookId}`), 1000);
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div className="info-card" style={{ maxWidth: "600px" }}>
        <div className="card-title"><span className="ms">video_library</span> Video Bilgileri</div>

        <div className="form-group">
          <label>Kitap *</label>
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} required>
            <option value="">-- Kitap seçin --</option>
            {books.map((b) => (
              <option key={b.documentId} value={b.documentId}>{b.title}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="form-group">
            <label>Bölüm Adı</label>
            <input value={bolumAdi} onChange={(e) => setBolumAdi(e.target.value)} placeholder="Örn: 1. Ünite - Analitik Geometri" />
          </div>
          <div className="form-group">
            <label>Bölüm No</label>
            <input type="number" value={bolumNo} onChange={(e) => setBolumNo(Number(e.target.value))} min={1} />
          </div>
        </div>

        <div className="form-group">
          <label>Test / Video Başlığı *</label>
          <input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Örn: Test 1 - Doğru Denklemi" required />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="form-group">
            <label>YouTube ID veya URL *</label>
            <input
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
              placeholder="dQw4w9WgXcQ veya https://youtu.be/..."
              required
            />
            <small>URL girerseniz ID otomatik çıkartılır</small>
          </div>
          <div className="form-group">
            <label>Sıra No</label>
            <input type="number" value={sira} onChange={(e) => setSira(Number(e.target.value))} min={1} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button className="btn btn-ghost" onClick={() => router.back()}>◀ İptal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <span className="ms">save</span>
            {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
          </button>
        </div>
      </div>
    </>
  );
}
