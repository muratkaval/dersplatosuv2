"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toMediaUrl } from "@/app/lib/strapi";

interface FaqRow {
  id: string;
  q: string;
  a: string;
}

interface Props {
  exam?: any;
}

function slugify(t: string) {
  return t.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

async function uploadFile(file: File): Promise<number | null> {
  const fd = new FormData();
  fd.append("files", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (res.ok && data?.[0]) return data[0].id;
  return null;
}

// "YYYY-MM-DDTHH:mm:ss.000Z" -> datetime-local'in beklediği "YYYY-MM-DDTHH:mm"
function formatDateForInput(isoString?: string) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// faq alanı json; kayıt bozuksa formu düşürmeden boş listeye düş.
function parseFaq(raw: any): FaqRow[] {
  let list = raw;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list.map((item: any, idx: number) => ({
    id: `f-${Date.now()}-${idx}`,
    q: String(item?.q || ""),
    a: String(item?.a || ""),
  }));
}

export default function DenemeForm({ exam }: Props) {
  const router = useRouter();
  const isEdit = !!exam?.documentId;

  const [title, setTitle] = useState(exam?.title || "");
  const [slug, setSlug] = useState(exam?.slug || "");
  const [subtitle, setSubtitle] = useState(exam?.subtitle || "");
  const [examDate, setExamDate] = useState(formatDateForInput(exam?.examDate));
  const [description, setDescription] = useState(exam?.description || "");

  const [btn1Text, setBtn1Text] = useState(exam?.btn1Text || "");
  const [btn1Link, setBtn1Link] = useState(exam?.btn1Link || "");
  const [btn2Text, setBtn2Text] = useState(exam?.btn2Text || "");
  const [btn2Link, setBtn2Link] = useState(exam?.btn2Link || "");

  const [mediaType, setMediaType] = useState<"video" | "image">(exam?.mediaType === "image" ? "image" : "video");
  const [videoUrl, setVideoUrl] = useState(exam?.videoUrl || "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(toMediaUrl(exam?.cover?.url));
  const [coverId, setCoverId] = useState<number | null>(exam?.cover?.id ?? null);

  const [faq, setFaq] = useState<FaqRow[]>(parseFaq(exam?.faq));

  const [enabled, setEnabled] = useState<boolean>(exam?.enabled ?? true);
  const [displayOrder, setDisplayOrder] = useState<string>(exam?.displayOrder?.toString() ?? "");
  const [metaTitle, setMetaTitle] = useState(exam?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(exam?.metaDescription || "");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addFaq() {
    setFaq([...faq, { id: `f-${Date.now()}`, q: "", a: "" }]);
  }

  function updateFaq(id: string, field: "q" | "a", value: string) {
    setFaq((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  }

  function removeFaq(id: string) {
    setFaq((prev) => prev.filter((f) => f.id !== id));
  }

  function moveFaq(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= faq.length) return;
    const copy = [...faq];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setFaq(copy);
  }

  function clearCover() {
    setCoverFile(null);
    setCoverPreview("");
    setCoverId(null);
  }

  async function handleSave() {
    if (!title.trim()) { showToast("Üst başlık zorunludur", "error"); return; }

    setSaving(true);
    try {
      let finalCoverId = coverId;
      if (coverFile) {
        const up = await uploadFile(coverFile);
        if (up) finalCoverId = up;
        else { showToast("Görsel yüklenemedi", "error"); setSaving(false); return; }
      }

      const payload: any = {
        title,
        slug: slug || slugify(title),
        subtitle,
        description,
        btn1Text,
        btn1Link,
        btn2Text,
        btn2Link,
        mediaType,
        videoUrl,
        cover: finalCoverId,
        faq: faq
          .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
          .filter((f) => f.q),
        examDate: examDate ? new Date(examDate).toISOString() : null,
        enabled,
        displayOrder: displayOrder === "" ? 0 : Number(displayOrder),
        metaTitle,
        metaDescription,
      };

      const url = isEdit ? `/api/admin/exams/${exam.documentId}` : "/api/admin/exams";
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

      showToast(isEdit ? "Deneme güncellendi ✓" : "Deneme eklendi ✓");
      setTimeout(() => router.push("/admin/denemeler"), 1000);
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  const rowStyle: React.CSSProperties = {
    background: "#0b1628",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #1e3a5f",
  };
  const fieldStyle: React.CSSProperties = {
    padding: "10px",
    background: "#060d1a",
    border: "1px solid #1e3a5f",
    color: "#e2e8f0",
    borderRadius: "6px",
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
  };

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Sol Kolon */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div className="info-card">
            <div className="card-title"><span className="ms">edit_note</span> Temel Bilgiler</div>

            <div className="form-group">
              <label>Üst Başlık</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!isEdit) setSlug(slugify(e.target.value));
                }}
                placeholder="Örn: TYT Genel Deneme Sınavı"
              />
            </div>

            <div className="form-group">
              <label>URL Slug</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "0.82rem", whiteSpace: "nowrap" }}>dersplatosu.com/denemeler/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  style={{ flex: 1 }}
                  placeholder="tyt-genel-deneme-1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Alt Başlık</label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                rows={3}
                placeholder="Örn: 14 Aralık, Türkiye geneli, ücretsiz. Sonuçlar 3 gün içinde açıklanır."
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Sınav Tarihi ve Saati (opsiyonel)</label>
              <input
                type="datetime-local"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
          </div>

          <div className="info-card">
            <div className="card-title"><span className="ms">smart_button</span> Butonlar</div>

            <div className="form-group">
              <label>1. Buton — Metin</label>
              <input value={btn1Text} onChange={(e) => setBtn1Text(e.target.value)} placeholder="Örn: Hemen Kayıt Ol" />
            </div>
            <div className="form-group">
              <label>1. Buton — Link</label>
              <input value={btn1Link} onChange={(e) => setBtn1Link(e.target.value)} placeholder="https://... veya /kayit" />
            </div>

            <div className="form-group">
              <label>2. Buton — Metin (opsiyonel)</label>
              <input value={btn2Text} onChange={(e) => setBtn2Text(e.target.value)} placeholder="Örn: Kılavuzu İndir" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>2. Buton — Link</label>
              <input value={btn2Link} onChange={(e) => setBtn2Link(e.target.value)} placeholder="https://... veya /kilavuz.pdf" />
            </div>
          </div>

          <div className="info-card">
            <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><span className="ms">quiz</span> Sıkça Sorulan Sorular</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addFaq} style={{ padding: "4px 8px" }}>
                <span className="ms">add</span> Soru Ekle
              </button>
            </div>

            {faq.length === 0 ? (
              <div className="empty-state">Soru eklenmemiş.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {faq.map((f, i) => (
                  <div key={f.id} style={rowStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <span style={{ color: "#64748b", fontSize: "0.78rem", flex: 1 }}>{i + 1}. soru</span>
                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => moveFaq(i, -1)} disabled={i === 0} title="Yukarı taşı">
                        <span className="ms">arrow_upward</span>
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => moveFaq(i, 1)} disabled={i === faq.length - 1} title="Aşağı taşı">
                        <span className="ms">arrow_downward</span>
                      </button>
                      <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeFaq(f.id)} title="Sil">
                        <span className="ms">delete</span>
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <input
                        value={f.q}
                        onChange={(e) => updateFaq(f.id, "q", e.target.value)}
                        placeholder="Soru (Örn: Sınava nasıl katılırım?)"
                        style={fieldStyle}
                      />
                      <textarea
                        value={f.a}
                        onChange={(e) => updateFaq(f.id, "a", e.target.value)}
                        placeholder="Cevap"
                        rows={3}
                        style={fieldStyle}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sağ Kolon */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div className="info-card">
            <div className="card-title"><span className="ms">collections</span> Video / Görsel</div>

            <div className="form-group">
              <label>Ne gösterilsin?</label>
              <select value={mediaType} onChange={(e) => setMediaType(e.target.value as "video" | "image")}>
                <option value="video">Video</option>
                <option value="image">Görsel</option>
              </select>
            </div>

            {mediaType === "video" ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Video Linki (YouTube)</label>
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <small style={{ color: "#64748b", fontSize: "0.75rem" }}>
                  Video boş bırakılırsa, yüklenmiş görsel varsa o gösterilir.
                </small>
              </div>
            ) : null}

            <div className="form-group" style={{ marginBottom: 0, marginTop: mediaType === "video" ? "16px" : 0 }}>
              <label>{mediaType === "image" ? "Görsel" : "Görsel (video yoksa yedek)"}</label>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "80px", height: "50px", background: "#0f172a", border: "1.5px dashed #1e3a5f", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {coverPreview
                    ? <img src={coverPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span className="ms" style={{ fontSize: "1.2rem", opacity: 0.2 }}>image</span>}
                </div>
                <label className="btn btn-ghost btn-sm" style={{ flex: 1, borderStyle: "solid", borderColor: "#1e3a5f", cursor: "pointer" }}>
                  <span className="ms">add_a_photo</span> {coverPreview ? "Değiştir" : "Görsel Seç"}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                    }}
                  />
                </label>
                {coverPreview && (
                  <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={clearCover} title="Görseli kaldır">
                    <span className="ms">delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="card-title"><span className="ms">tune</span> Yayın Ayarları</div>

            <div className="form-group">
              <label>Sıra (küçük olan üstte)</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{ width: "18px", height: "18px" }}
              />
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>Sitede Yayında</span>
            </label>
          </div>

          <div className="info-card">
            <div className="card-title"><span className="ms">public</span> SEO Ayarları</div>
            <div className="form-group">
              <label>SEO Başlığı (Meta Title)</label>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Boş bırakılırsa üst başlık kullanılır"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>SEO Açıklaması (Meta Description)</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                placeholder="Boş bırakılırsa alt başlık kullanılır"
              />
            </div>
          </div>

        </div>
      </div>

      <div className="info-card" style={{ marginTop: "20px" }}>
        <div className="card-title"><span className="ms">segment</span> Açıklama Metni (opsiyonel)</div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Sıkça sorulan soruların üstünde gösterilir</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Sınavın kapsamı, süresi, katılım koşulları..."
          />
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/admin/denemeler")}>◀ İptal</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </>
  );
}
