"use client";

import { useState } from "react";

interface Props {
  initialData: any;
  token: string;
}

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340";

export function PopupForm({ initialData }: Props) {
  const settings = initialData || {};

  const [enabled, setEnabled] = useState<boolean>(!!settings.popupEnabled);
  const [image, setImage] = useState<any>(settings.popupImage || null); // { id, url, file? } | null
  const [imageAlt, setImageAlt] = useState<string>(settings.popupImageAlt || "");
  const [link, setLink] = useState<string>(settings.popupLink || "");
  const [linkNewTab, setLinkNewTab] = useState<boolean>(!!settings.popupLinkNewTab);
  const [scope, setScope] = useState<string>(settings.popupScope || "home");
  const [frequency, setFrequency] = useState<string>(settings.popupFrequency || "session");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Popup görseli (tekli): yeni dosya varsa yükle → id; mevcut id varsa onu; hiç yoksa null
      let imageId: number | null = null;
      if (image?.file) {
        const fd = new FormData();
        fd.append("files", image.file);
        const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const upData = await up.json();
        if (up.ok && upData[0]) imageId = upData[0].id;
      } else if (image?.id) {
        imageId = image.id;
      }

      const payload = {
        popupEnabled: enabled,
        popupImage: imageId,
        popupImageAlt: imageAlt,
        popupLink: link,
        popupLinkNewTab: linkNewTab,
        popupScope: scope,
        popupFrequency: frequency,
      };

      const res = await fetch("/api/admin/global-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Popup ayarları kaydedildi ✓");
      } else {
        console.error("Popup save error:", res.status, data);
        showToast("Hata: " + (data?.error?.message || "Bilinmeyen hata"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  const previewSrc = image
    ? (image.url?.startsWith("blob") ? image.url : STRAPI + image.url)
    : "";

  return (
    <div className="seo-form-container">
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        {/* Aç/Kapa toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}>
          <span
            onClick={() => setEnabled((v) => !v)}
            style={{
              width: "46px",
              height: "26px",
              borderRadius: "20px",
              background: enabled ? "#22c55e" : "rgba(255,255,255,0.15)",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
              display: "inline-block",
            }}
          >
            <span style={{ position: "absolute", top: "3px", left: enabled ? "23px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </span>
          <span style={{ fontWeight: 700, color: enabled ? "#22c55e" : "var(--text-muted)" }}>
            {enabled ? "Popup AÇIK" : "Popup KAPALI"}
          </span>
        </label>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : "Kaydet & Uygula"}
        </button>
      </div>

      <div className="info-card" style={{ borderTop: "4px solid #fbbf24" }}>
        <div className="card-title" style={{ color: "#fbbf24" }}><span className="ms">web_asset</span> Popup İçeriği</div>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "-4px 0 14px" }}>
          Sitede açılacak duyuru penceresi. Resme tıklanınca (link verdiysen) o adrese gider. Mobil uyumludur.
        </p>

        {/* Görsel */}
        <div className="form-group">
          <label>POPUP GÖRSELİ</label>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginTop: "8px", flexWrap: "wrap" }}>
            {image ? (
              <div style={{ position: "relative", width: "160px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={previewSrc} alt="Popup önizleme" style={{ maxWidth: "100%", height: "auto", display: "block" }} />
                <button
                  onClick={() => setImage(null)}
                  style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(239,68,68,0.85)", border: "none", color: "white", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <span className="ms" style={{ fontSize: "15px" }}>close</span>
                </button>
              </div>
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImage({ url: URL.createObjectURL(file), file });
                e.target.value = "";
              }}
              style={{ display: "none" }}
              id="popup-image-upload"
            />
            <label htmlFor="popup-image-upload" style={{ width: "120px", height: "90px", border: "1px dashed rgba(255,255,255,0.25)", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
              <span className="ms">add_photo_alternate</span>
              <span style={{ fontSize: "11px" }}>{image ? "Değiştir" : "Görsel Yükle"}</span>
            </label>
          </div>
        </div>

        {/* Görsel alt metni (SEO/erişilebilirlik) */}
        <div className="form-group">
          <label>GÖRSEL ALT METNİ (opsiyonel)</label>
          <input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Örn: Yaz kampı kayıtları açıldı" />
        </div>

        {/* Link */}
        <div className="form-group">
          <label>TIKLAMA LİNKİ (opsiyonel)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Örn: /kamplar veya https://..." />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={linkNewTab} onChange={(e) => setLinkNewTab(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
            Link yeni sekmede açılsın
          </label>
        </div>
      </div>

      <div className="info-card" style={{ borderTop: "4px solid #6366f1", marginTop: "20px" }}>
        <div className="card-title" style={{ color: "#6366f1" }}><span className="ms">tune</span> Görünüm Ayarları</div>

        <div className="form-group">
          <label>NEREDE GÖSTERİLSİN</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)} style={{ width: "100%", padding: "9px 11px", background: "#0b1530", border: "1px solid rgba(255,255,255,0.14)", color: "#e2e8f0", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.9rem", cursor: "pointer" }}>
            <option value="home">Sadece anasayfa</option>
            <option value="all">Tüm sayfalar</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>GÖSTERİM SIKLIĞI</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ width: "100%", padding: "9px 11px", background: "#0b1530", border: "1px solid rgba(255,255,255,0.14)", color: "#e2e8f0", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.9rem", cursor: "pointer" }}>
            <option value="session">Oturumda bir kez (önerilen)</option>
            <option value="daily">Günde bir kez</option>
            <option value="always">Her ziyarette</option>
          </select>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "6px" }}>
            Yeni bir görsel yüklersen, kullanıcı öncekini kapatmış olsa bile popup tekrar gösterilir.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PopupForm;
