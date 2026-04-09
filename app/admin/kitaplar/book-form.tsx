"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  book?: any;
  subjects: any[];
  categories: any[];
  instructors: any[];
}

export default function BookForm({ book, subjects, categories, instructors }: Props) {
  const router = useRouter();
  const isEdit = !!book?.documentId;

  const [title, setTitle] = useState(book?.title || "");
  const [buyLink, setBuyLink] = useState(book?.buy_link || "");
  const [solutionLink, setSolutionLink] = useState(book?.solution_link || "");
  const [featured, setFeatured] = useState(book?.featured || false);
  
  const [selSubs, setSelSubs] = useState<string[]>((book?.subjects || []).map((s: any) => s.documentId || String(s.id)));
  const [selCats, setSelCats] = useState<string[]>((book?.solution_categories || []).map((c: any) => c.documentId || String(c.id)));
  const [selIns, setSelIns] = useState<string[]>((book?.instructors || []).map((i: any) => i.documentId || String(i.id)));

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(book?.cover?.url || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function toggleMulti(id: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSave() {
    if (!title.trim()) { showToast("Başlık zorunludur", "error"); return; }
    setSaving(true);

    try {
      let coverId = null;

      // Handle image upload first
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
        buy_link: buyLink,
        solution_link: solutionLink,
        featured,
        subjects: selSubs,
        solution_categories: selCats,
        instructors: selIns,
        ...(coverId ? { cover: coverId } : {}),
      };

      const url = isEdit ? `/api/admin/books/${book.documentId}` : "/api/admin/books";
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

      showToast(isEdit ? "Kitap güncellendi ✓" : "Kitap eklendi ✓");
      setTimeout(() => router.push("/admin/kitaplar"), 1000);
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div className="form-grid">
        {/* Sol Kolon */}
        <div>
          <div className="info-card" style={{ marginBottom: "20px" }}>
            <div className="card-title"><span className="ms">edit_note</span> Temel Bilgiler</div>
            
            <div className="form-group">
              <label>Kitap Başlığı *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: AYT Matematik Soru Bankası" />
            </div>

            <div className="form-group">
              <label>Satın Alma Linki</label>
              <input value={buyLink} onChange={(e) => setBuyLink(e.target.value)} placeholder="https://..." />
            </div>

            <div className="form-group">
              <label>Çözüm / Demo Linki</label>
              <input value={solutionLink} onChange={(e) => setSolutionLink(e.target.value)} placeholder="https://..." />
            </div>

            <div className="form-group">
              <label className="checkbox-label" style={{ padding: 0 }}>
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Öne Çıkan Kitap
              </label>
            </div>
          </div>

          <div className="info-card">
            <div className="card-title"><span className="ms">image</span> Kapak Görseli</div>
            
            <div style={{ marginBottom: "16px", textAlign: "center" }}>
              {previewUrl ? (
                <img 
                  src={previewUrl.startsWith("http") || previewUrl.startsWith("blob") ? previewUrl : `${process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340"}${previewUrl}`} 
                  alt="Preview" 
                  style={{ width: "120px", height: "170px", objectFit: "cover", borderRadius: "8px", border: "2px solid #1e3a5f" }} 
                />
              ) : (
                <div style={{ width: "120px", height: "170px", background: "#0b1221", border: "2px dashed #1e3a5f", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", color: "#475569" }}>
                  <span className="ms" style={{ fontSize: "2rem" }}>add_photo_alternate</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: "8px" }} />
              <small>Maksimum 2MB. Kare veya dikey format önerilir.</small>
            </div>
          </div>
        </div>

        {/* Sağ Kolon */}
        <div>
          <div className="info-card">
            <div className="card-title"><span className="ms">link</span> İlişkiler</div>

            <div className="form-group">
              <label>Branşlar / Dersler</label>
              <div className="checkbox-list">
                {subjects.map((s) => (
                  <label key={s.documentId || s.id} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={selSubs.includes(s.documentId || String(s.id))} 
                      onChange={() => toggleMulti(s.documentId || String(s.id), selSubs, setSelSubs)} 
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Kitap Kategorileri</label>
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
                {instructors.map((i) => (
                  <label key={i.documentId || i.id} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={selIns.includes(i.documentId || String(i.id))} 
                      onChange={() => toggleMulti(i.documentId || String(i.id), selIns, setSelIns)} 
                    />
                    {i.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button className="btn btn-ghost" onClick={() => router.push("/admin/kitaplar")}>◀ İptal</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </>
  );
}
