"use client";

import { useState } from "react";

interface Props {
  pageKey: string;
  allHeaders: Record<string, any>;
  defaults: { title: string; highlight?: string; subtitle: string };
}

export default function PageHeaderEditor({ pageKey, allHeaders, defaults }: Props) {
  const cur = (allHeaders && allHeaders[pageKey]) || {};
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(cur.title ?? defaults.title);
  const [highlight, setHighlight] = useState(cur.highlight ?? defaults.highlight ?? "");
  const [subtitle, setSubtitle] = useState(cur.subtitle ?? defaults.subtitle);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function save() {
    setSaving(true);
    try {
      const merged = { ...(allHeaders || {}), [pageKey]: { title, highlight, subtitle } };
      const res = await fetch("/api/admin/global-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageHeaders: merged }),
      });
      if (res.ok) {
        showToast("Başlık kaydedildi ✓");
        setTimeout(() => setOpen(false), 900);
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d?.error || "Kayıt hatası", "error");
      }
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        <span className="ms">tune</span> Başlık Ayarı
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !saving && setOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3>Sayfa Başlığı</h3>
              <button disabled={saving} onClick={() => setOpen(false)} className="btn btn-ghost btn-icon">
                <span className="ms">close</span>
              </button>
            </div>

            <div className="form-group">
              <label>Başlık (beyaz kısım)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Ders Platosu" autoFocus />
            </div>
            <div className="form-group">
              <label>Vurgulu kısım (mavi) — opsiyonel</label>
              <input value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="Örn: Kitapları" />
            </div>
            <div className="form-group">
              <label>Alt başlık</label>
              <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} placeholder="Sayfa açıklaması" />
            </div>

            <div style={{ background: "#0b1628", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "14px 16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "0.7rem", color: "#475569", marginBottom: "6px" }}>Önizleme</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#e2e8f0" }}>
                {title} {highlight && <span style={{ color: "#60a5fa" }}>{highlight}</span>}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px" }}>{subtitle}</div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOpen(false)} disabled={saving}>İptal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
