"use client";

import { useState } from "react";

interface Subj { id: number; documentId: string; name: string; }
type Category = { name: string; options: string[] };

interface Props {
  initialVideo: string;
  initialCategories?: Category[];
  initialSubjects: Subj[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { name: "TYT", options: ["0-60 Net", "60-90 Net", "+90 Net"] },
  { name: "AYT", options: ["Sayısal", "Eşit Ağırlık", "Sözel", "Dil (YDT)"] },
  { name: "Maarif", options: ["9'dan 10'a Geçen", "10'dan 11'e Geçen"] },
  { name: "TYT + 11. Sınıf", options: ["Sayısal", "Eşit Ağırlık", "Sözel"] },
];

const inputStyle: React.CSSProperties = { padding: "11px 14px", background: "#060d1a", border: "1.5px solid #1e3a5f", color: "#e2e8f0", borderRadius: "8px", outline: "none", fontSize: "0.9rem" };

export default function ProgramSettingsForm({ initialVideo, initialCategories, initialSubjects }: Props) {
  const [video, setVideo] = useState(initialVideo || "");
  const [categories, setCategories] = useState<Category[]>(
    Array.isArray(initialCategories) && initialCategories.length
      ? initialCategories.map((c) => ({ name: c?.name || "", options: Array.isArray(c?.options) ? c.options : [] }))
      : DEFAULT_CATEGORIES
  );
  const [newOpt, setNewOpt] = useState<Record<number, string>>({});
  const [subjects, setSubjects] = useState<Subj[]>(initialSubjects);
  const [newSubject, setNewSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Ana kategori + alt seçenek ─────────────────────────────
  function addCategory() { setCategories((p) => [...p, { name: "", options: [] }]); }
  function removeCategory(idx: number) { setCategories((p) => p.filter((_, i) => i !== idx)); }
  function updateCatName(idx: number, name: string) { setCategories((p) => p.map((c, i) => (i === idx ? { ...c, name } : c))); }
  function addOption(idx: number) {
    const v = (newOpt[idx] || "").trim();
    if (!v) return;
    setCategories((p) => p.map((c, i) => (i === idx ? (c.options.includes(v) ? c : { ...c, options: [...c.options, v] }) : c)));
    setNewOpt((p) => ({ ...p, [idx]: "" }));
  }
  function removeOption(idx: number, oi: number) {
    setCategories((p) => p.map((c, i) => (i === idx ? { ...c, options: c.options.filter((_, j) => j !== oi) } : c)));
  }

  // ── Dersler ────────────────────────────────────────────────
  async function addSubject() {
    const name = newSubject.trim();
    if (!name) return;
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const r = await res.json();
      const it = r.data;
      setSubjects([{ id: it.id, documentId: it.documentId || String(it.id), name: it.name }, ...subjects]);
      setNewSubject("");
      showToast("Ders eklendi ✓");
    } else {
      showToast("Ders eklenemedi", "error");
    }
  }
  async function removeSubject(docId: string) {
    if (!confirm("Bu dersi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/subjects/${docId}`, { method: "DELETE" });
    if (res.ok) {
      setSubjects(subjects.filter((s) => s.documentId !== docId));
      showToast("Ders silindi ✓");
    } else {
      showToast("Silinemedi", "error");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payloadCats = categories
        .filter((c) => c.name.trim())
        .map((c) => ({ name: c.name.trim(), options: c.options.map((o) => o.trim()).filter(Boolean) }));
      const res = await fetch("/api/admin/global-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programsPageVideo: video, programCategoryOptions: payloadCats }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d?.error || "Kayıt hatası", "error");
        return;
      }
      showToast("Ayarlar kaydedildi ✓");
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  const chip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "50px", padding: "6px 8px 6px 14px", fontSize: "0.85rem", fontWeight: 600 };

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Üst video */}
          <div className="info-card">
            <div className="card-title"><span className="ms">smart_display</span> Üst Tanıtım Videosu</div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>YouTube linki / video ID</label>
              <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/..." />
              <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "4px" }}>/programlar sayfasının en üstünde gösterilir. Boş bırakılırsa video alanı görünmez.</p>
            </div>
          </div>

          {/* Ana Filtre & Alt Filtreler */}
          <div className="info-card">
            <div className="card-title"><span className="ms">filter_alt</span> Ana Filtre &amp; Alt Filtreler</div>
            <p style={{ fontSize: "0.72rem", color: "#475569", margin: "-4px 0 14px" }}>
              /programlar sayfasındaki ana kategori kutuları ve her birinin alt seçenekleri. Program eklerken kategori + alt seçenekler buradan seçilir.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {categories.map((cat, idx) => (
                <div key={idx} style={{ border: "1.5px solid #1a2536", borderRadius: "12px", background: "#060d1a", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid #111d2e" }}>
                    <span className="ms" style={{ color: "#60a5fa", fontSize: "18px", flexShrink: 0 }}>folder</span>
                    <input value={cat.name} onChange={(e) => updateCatName(idx, e.target.value)} placeholder="Ana kategori (örn: TYT)" style={{ flex: 1, ...inputStyle, fontWeight: 700 }} />
                    <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeCategory(idx)}><span className="ms">delete</span></button>
                  </div>
                  <div style={{ padding: "12px" }}>
                    {cat.options.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                        {cat.options.map((o, oi) => (
                          <span key={oi} style={chip}>
                            {o}
                            <button type="button" onClick={() => removeOption(idx, oi)} className="btn btn-ghost btn-icon" style={{ width: "22px", height: "22px", padding: 0, color: "#93c5fd" }}>
                              <span className="ms" style={{ fontSize: "15px" }}>close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input value={newOpt[idx] || ""} onChange={(e) => setNewOpt((p) => ({ ...p, [idx]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption(idx))} placeholder="Alt seçenek (örn: 0-60 Net)" style={{ flex: 1, ...inputStyle }} />
                      <button type="button" className="btn btn-ghost" onClick={() => addOption(idx)}><span className="ms">add</span> Alt Ekle</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-ghost" onClick={addCategory} style={{ marginTop: "14px", width: "100%", justifyContent: "center" }}>
              <span className="ms">add</span> Ana Kategori Ekle
            </button>
            <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "10px" }}>Değişiklikler &quot;Kaydet&quot; ile geçerli olur.</p>
          </div>
        </div>

        {/* Dersler */}
        <div className="info-card">
          <div className="card-title"><span className="ms">category</span> Dersler / Branşlar</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())} placeholder="Yeni ders (örn: Geometri)" style={{ flex: 1, ...inputStyle }} />
            <button type="button" className="btn btn-primary" onClick={addSubject}><span className="ms">add</span> Ekle</button>
          </div>
          <div style={{ maxHeight: "360px", overflowY: "auto", border: "1.5px solid #1a2536", borderRadius: "12px", background: "#060d1a" }}>
            {subjects.length === 0 ? (
              <div className="empty-state">Ders yok.</div>
            ) : (
              subjects.map((s, idx) => (
                <div key={s.documentId} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: idx === subjects.length - 1 ? "none" : "1px solid #111d2e" }}>
                  <span style={{ flex: 1, color: "#cbd5e1", fontSize: "0.9rem", fontWeight: 500 }}>{s.name}</span>
                  <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeSubject(s.documentId)}><span className="ms">delete</span></button>
                </div>
              ))
            )}
          </div>
          <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "8px" }}>Dersler anında kaydedilir. (Kategoriler sayfasından da yönetilebilir.)</p>
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : "Filtre Ayarlarını Kaydet"}
        </button>
      </div>
    </>
  );
}
