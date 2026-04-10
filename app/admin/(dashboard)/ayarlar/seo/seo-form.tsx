"use client";

import { useState, useRef } from "react";
import { adminPut, adminUpload } from "@/app/admin/lib/strapi-admin";
import { toMediaUrl } from "@/app/lib/strapi";

interface Props {
  initialData: any;
  token: string;
}

export default function SeoForm({ initialData, token }: Props) {
  const settings = initialData?.attributes || initialData || {};
  const docId = initialData?.documentId;

  // Form states
  const [siteName, setSiteName] = useState(settings.siteName || "");
  const [ogTitle, setOgTitle] = useState(settings.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(settings.ogDescription || "");
  
  // Script / Verification states
  const [googleSearchConsole, setGoogleSearchConsole] = useState(settings.googleSearchConsole || "");
  const [bingWebmaster, setBingWebmaster] = useState(settings.bingWebmaster || "");
  const [yandexVerification, setYandexVerification] = useState(settings.yandexVerification || "");
  
  // Analytics states
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(settings.googleAnalyticsId || "");
  const [gtmId, setGtmId] = useState(settings.gtmId || "");
  const [facebookPixelId, setFacebookPixelId] = useState(settings.facebookPixelId || "");

  // Media states
  const [shareImgPreview, setShareImgPreview] = useState(toMediaUrl(settings.shareImage?.url || settings.shareImage));
  const [shareImgFile, setShareImgFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState(toMediaUrl(settings.favicon?.url || settings.favicon));
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const shareInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      let shareImageId = settings.shareImage?.id || null;
      let faviconId = settings.favicon?.id || null;

      // 1. Upload new media if selected
      if (shareImgFile) {
        const up = await adminUpload(shareImgFile, token);
        if (up && up[0]) shareImageId = up[0].id;
      }
      if (faviconFile) {
        const up = await adminUpload(faviconFile, token);
        if (up && up[0]) faviconId = up[0].id;
      }

      // 2. Prepare payload
      const payload = {
        siteName,
        ogTitle,
        ogDescription,
        googleSearchConsole,
        bingWebmaster,
        yandexVerification,
        googleAnalyticsId,
        gtmId,
        facebookPixelId,
        shareImage: shareImageId,
        favicon: faviconId,
      };

      // 3. Update single type
      const res = await adminPut("/global-setting", payload, token);
      
      if (res.ok) {
        showToast("Ayarlar başarıyla kaydedildi ✓");
      } else {
        showToast("Kayıt sırasında bir hata oluştu", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="seo-form-container">
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Uygulanıyor..." : "Kaydet & Uygula"}
        </button>
      </div>

      <div className="form-grid-seo">
        {/* Left Col */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Section: Başlık & Açıklama */}
          <div className="info-card">
            <div className="card-title"><span className="ms">description</span> Başlık & Açıklama</div>
            
            <div className="form-group">
              <label>SİTE ADI</label>
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Ders Platosu" />
              <small>Paylaşımlarda görünen ana site adı.</small>
            </div>

            <div className="form-group">
              <label>OG BAŞLIK</label>
              <input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Ders Platosu - En Kapsamlı Eğitim Platformu" />
              <small>Paylaşım kartında görünen ana başlık.</small>
            </div>

            <div className="form-group">
              <label>OG AÇIKLAMA</label>
              <textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} placeholder="Türkiye'nin en kapsamlı ücretsiz online eğitim platformu..." rows={4} />
              <small>Paylaşım kartında başlığın altında görünen açıklama metni.</small>
            </div>
          </div>

          {/* Section: Arama Motoru Doğrulama */}
          <div className="info-card">
            <div className="card-title" style={{ color: "#10b981" }}><span className="ms">verified_user</span> Arama Motoru Doğrulama</div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "16px" }}>Yalnızca doğrulama meta değerlerini buraya girin (content="..." içindeki değer).</p>
            
            <div className="form-group">
              <label>Google Search Console</label>
              <input value={googleSearchConsole} onChange={(e) => setGoogleSearchConsole(e.target.value)} placeholder="abcdef123..." />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label>Bing Webmaster</label>
                <input value={bingWebmaster} onChange={(e) => setBingWebmaster(e.target.value)} placeholder="MSV-..." />
              </div>
              <div className="form-group">
                <label>Yandex Webmaster</label>
                <input value={yandexVerification} onChange={(e) => setYandexVerification(e.target.value)} placeholder="ya-..." />
              </div>
            </div>
          </div>

        </div>

        {/* Right Col */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Section: Paylaşım Kapak Görseli */}
          <div className="info-card">
            <div className="card-title"><span className="ms">image</span> Paylaşım Kapak Görseli</div>
            <div style={{ background: "#06090f", border: "1.5px dashed var(--border)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
              {shareImgPreview ? (
                <img src={shareImgPreview} alt="Preview" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "8px", marginBottom: "16px" }} />
              ) : (
                <div style={{ padding: "40px", color: "var(--text-muted)" }}>
                  <span className="ms" style={{ fontSize: "40px", opacity: 0.3 }}>image</span>
                  <p style={{ fontSize: "0.8rem", marginTop: "10px" }}>Görsel seçilmedi</p>
                </div>
              )}
              
              <input 
                type="file" 
                ref={shareInputRef} 
                style={{ display: "none" }} 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setShareImgFile(file);
                    setShareImgPreview(URL.createObjectURL(file));
                  }
                }}
              />
              <button type="button" className="btn btn-ghost" style={{ width: "100%" }} onClick={() => shareInputRef.current?.click()}>
                {shareImgPreview ? "Görseli Değiştir" : "Görsel Yükle"}
              </button>
            </div>
            <small style={{ marginTop: "12px", textAlign: "center" }}>1200x630 piksel önerilir (Facebook/WhatsApp standart boyutu).</small>
          </div>

          {/* Section: Analitik & Takip */}
          <div className="info-card">
            <div className="card-title" style={{ color: "#a78bfa" }}><span className="ms">analytics</span> Analitik & Takip Kodları</div>
            
            <div className="form-group">
              <label>Google Analytics 4 (Measurement ID)</label>
              <input value={googleAnalyticsId} onChange={(e) => setGoogleAnalyticsId(e.target.value)} placeholder="G-XXXXXXXXXX" />
            </div>

            <div className="form-group">
              <label>Google Tag Manager (Container ID)</label>
              <input value={gtmId} onChange={(e) => setGtmId(e.target.value)} placeholder="GTM-XXXXXXX" />
            </div>

            <div className="form-group">
              <label>Facebook Pixel ID</label>
              <input value={facebookPixelId} onChange={(e) => setFacebookPixelId(e.target.value)} placeholder="123456789..." />
            </div>
          </div>

          {/* Section: Site İkonu (Favicon) */}
          <div className="info-card">
            <div className="card-title"><span className="ms">branding_watermark</span> Site İkonu (Favicon)</div>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", background: "#06090f", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div style={{ width: "48px", height: "48px", background: "#000", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {faviconPreview ? <img src={faviconPreview} alt="Fav" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span className="ms" style={{ opacity: 0.2 }}>broken_image</span>}
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="file" 
                  ref={faviconInputRef} 
                  style={{ display: "none" }} 
                  accept="image/png,image/x-icon,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFaviconFile(file);
                      setFaviconPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => faviconInputRef.current?.click()}>
                  İkonu Değiştir
                </button>
                <small style={{ fontSize: "0.65rem", marginTop: "4px" }}>PNG, ICO veya SVG (Maks. 1MB).</small>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
