"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  instructor?: any;
  subjects: any[];
}

function slugify(t: string) {
  return t.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function InstructorForm({ instructor, subjects }: Props) {
  const router = useRouter();
  const isEdit = !!instructor?.documentId;

  const [name, setName] = useState(instructor?.name || "");
  const [slug, setSlug] = useState(instructor?.slug || "");
  const [youtube, setYoutube] = useState(instructor?.youtube || "");
  const [instagram, setInstagram] = useState(instructor?.instagram || "");
  const [selSubs, setSelSubs] = useState<string[]>((instructor?.subjects || []).map((s: any) => s.documentId || String(s.id)));

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(instructor?.photo?.url || "");
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
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSave() {
    if (!name.trim()) { showToast("İsim zorunludur", "error"); return; }
    setSaving(true);

    try {
      let photoId = null;

      if (photoFile) {
        const formData = new FormData();
        formData.append("files", photoFile);
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData[0]) {
          photoId = uploadData[0].id;
        } else {
          showToast("Fotoğraf yüklenemedi", "error");
          setSaving(false);
          return;
        }
      }

      const payload = {
        name,
        slug: slug || slugify(name),
        youtube,
        instagram,
        subjects: selSubs,
        ...(photoId ? { photo: photoId } : {}),
      };

      const url = isEdit ? `/api/admin/instructors/${instructor.documentId}` : "/api/admin/instructors";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data?.error || "Kayıt hatası", "error");
        return;
      }

      showToast(isEdit ? "Eğitimci güncellendi ✓" : "Eğitimci eklendi ✓");
      setTimeout(() => router.push("/admin/egitimciler"), 1000);
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
        <div className="info-card">
          <div className="card-title"><span className="ms">edit_note</span> Temel Bilgiler</div>

          <div className="form-group">
            <label>Eğitimci İsmi *</label>
            <input 
              value={name} 
              onChange={(e) => {
                setName(e.target.value);
                if (!isEdit) setSlug(slugify(e.target.value));
              }} 
              placeholder="Örn: Murat Hoca" 
            />
          </div>

          <div className="form-group">
            <label>URL Slug</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#64748b", fontSize: "0.82rem", whiteSpace: "nowrap" }}>dersplatosu.com/hoca/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ flex: 1 }} placeholder="hoca-adi-soyadi" />
            </div>
          </div>

          <div className="form-group">
            <label>YouTube Kanal URL</label>
            <input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/@..." />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Instagram Profil URL</label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
          </div>
        </div>

        {/* Sağ Kolon */}
        <div>
          <div className="info-card" style={{ marginBottom: "20px" }}>
            <div className="card-title"><span className="ms">image</span> Profil Fotoğrafı</div>
            
            <div style={{ marginBottom: "16px", textAlign: "center" }}>
              {previewUrl ? (
                <img 
                  src={previewUrl.startsWith("http") || previewUrl.startsWith("blob") ? previewUrl : `${process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340"}${previewUrl}`} 
                  alt="Preview" 
                  style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "50%", border: "3px solid #1e3a5f" }} 
                />
              ) : (
                <div style={{ width: "120px", height: "120px", background: "#0b1221", border: "2px dashed #1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", color: "#475569" }}>
                  <span className="ms" style={{ fontSize: "2.5rem" }}>person</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: "8px" }} />
              <small>Kare formatında (1:1) yüklenmesi önerilir.</small>
            </div>
          </div>

          <div className="info-card">
            <div className="card-title"><span className="ms">link</span> Branşlar</div>
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
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button className="btn btn-ghost" onClick={() => router.push("/admin/egitimciler")}>◀ İptal</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </>
  );
}
