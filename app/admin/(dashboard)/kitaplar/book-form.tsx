"use client";

import { useState, useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
              <label>Demo / Önizleme Linki</label>
              <input value={solutionLink} onChange={(e) => setSolutionLink(e.target.value)} placeholder="https://online.fliphtml5.com/..." />
              <small>Kitabın online önizleme linki (FlipHTML5 vb.). Soru çözüm videoları için "Soru Çözümleri" bölümünü kullanın.</small>
            </div>

            <div
              className="form-group"
              style={{ marginBottom: 0 }}
            >
              <button
                type="button"
                onClick={() => setFeatured(!featured)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  width: "100%", padding: "12px 14px",
                  background: featured ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
                  border: featured ? "1px solid rgba(245,158,11,0.3)" : "1px solid #1a2536",
                  borderRadius: "10px", cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.2s", textAlign: "left",
                }}
              >
                <span className="ms" style={{ fontSize: "20px", color: featured ? "#fbbf24" : "#475569", transition: "color 0.2s" }}>
                  {featured ? "star" : "star_border"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: featured ? "#fbbf24" : "#94a3b8", transition: "color 0.2s" }}>
                    Öne Çıkan Kitap
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "2px" }}>
                    Ana sayfada ve listeleme sayfasında öne çıkar
                  </div>
                </div>
                {/* Toggle switch */}
                <div style={{
                  width: "40px", height: "22px", borderRadius: "11px", flexShrink: 0,
                  background: featured ? "#f59e0b" : "#1e3a5f",
                  position: "relative", transition: "background 0.2s",
                  boxShadow: featured ? "0 0 8px rgba(245,158,11,0.4)" : "none",
                }}>
                  <div style={{
                    position: "absolute", top: "3px",
                    left: featured ? "21px" : "3px",
                    width: "16px", height: "16px", borderRadius: "50%",
                    background: "#fff", transition: "left 0.2s",
                  }} />
                </div>
              </button>
            </div>
          </div>

          <div className="info-card" style={{ padding: "24px" }}>
            <div className="card-title" style={{ marginBottom: "20px" }}><span className="ms">image</span> Kapak Görseli</div>
            
            <div style={{ display: "flex", gap: "24px", alignItems: "start", flexWrap: "wrap" }}>
              {/* Preview Area */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {previewUrl ? (
                  <div style={{ position: "relative" }}>
                    <img 
                      src={previewUrl.startsWith("http") || previewUrl.startsWith("blob") ? previewUrl : `${process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340"}${previewUrl}`} 
                      alt="Preview" 
                      style={{ width: "210px", height: "295px", objectFit: "cover", borderRadius: "12px", border: "2px solid #1e3a5f", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} 
                    />
                    <div style={{ position: "absolute", top: "10px", right: "10px", background: "#10b981", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "0.65rem", fontWeight: 700, boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>✓ SEÇİLDİ</div>
                  </div>
                ) : (
                  <div style={{ width: "210px", height: "295px", background: "rgba(30,58,95,0.1)", border: "2px dashed #1e3a5f", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#475569" }}>
                    <span className="ms" style={{ fontSize: "2.5rem", marginBottom: "12px", opacity: 0.3 }}>auto_stories</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Kitap kapağı yok</span>
                  </div>
                )}
              </div>

              {/* Action Area */}
              <div style={{ flex: 1, minWidth: "250px" }}>
                <div style={{ background: "rgba(59,130,246,0.03)", border: "1px solid #1a2e47", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ fontSize: "0.85rem", color: "#60a5fa", fontWeight: 700, marginBottom: "8px" }}>Görsel Seçimi</div>
                  <p style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
                    Kitabın ön yüzü için dikey formatta bir kapak dosyası seçin. Net bir görünüm için yüksek çözünürlüklü görseller tavsiye edilir.
                  </p>

                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*" 
                    onChange={handleFileChange} 
                    style={{ display: "none" }} 
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: "rgba(59,130,246,0.15)",
                      border: "1.5px solid #3b82f6",
                      borderRadius: "10px",
                      color: "#60a5fa",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                      fontWeight: 700,
                      fontSize: "0.85rem"
                    }}
                  >
                    <span className="ms" style={{ fontSize: "20px" }}>add_a_photo</span>
                    Burasıya tıkla ve kapak yükle
                  </button>
                  <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: "12px", textAlign: "center" }}>
                    Desteklenen formatlar: PNG, JPG, WebP (Maks. 2MB)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Kolon */}
        <div>
          <div className="info-card">
            <div className="card-title"><span className="ms">link</span> İlişkiler</div>

            {(
              [
                { label: "Branşlar / Dersler", items: subjects,     sel: selSubs, setSel: setSelSubs, nameKey: "name",  accent: "#60a5fa", accentBg: "rgba(59,130,246,0.12)"  },
                { label: "Kitap Kategorileri",  items: categories,  sel: selCats, setSel: setSelCats, nameKey: "name",  accent: "#a78bfa", accentBg: "rgba(139,92,246,0.12)"  },
                { label: "Eğitimciler",          items: instructors, sel: selIns,  setSel: setSelIns,  nameKey: "name",  accent: "#34d399", accentBg: "rgba(16,185,129,0.12)" },
              ] as const
            ).map(({ label, items, sel, setSel, nameKey, accent, accentBg }, gi) => (
              <div key={gi} className="form-group" style={{ marginBottom: gi === 2 ? 0 : undefined }}>
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{label}</span>
                  {sel.length > 0 && (
                    <span style={{ background: accentBg, color: accent, borderRadius: "50px", padding: "1px 10px", fontSize: "0.68rem", fontWeight: 700 }}>
                      {sel.length} / {items.length}
                    </span>
                  )}
                </label>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #1a2536", borderRadius: "10px", background: "#060e1a" }}>
                  {(items as any[]).map((item, idx) => {
                    const id = item.documentId || String(item.id);
                    const name = item[nameKey as string] as string;
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
                          textAlign: "left", transition: "background 0.15s, color 0.15s",
                        }}
                      >
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
                        {selected && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: accent, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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

