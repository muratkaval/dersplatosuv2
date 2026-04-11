"use client";

import { useState } from "react";
// import removed, using nextjs api route now

interface Props {
  initialData: any;
  token: string;
}

export function SiteForm({ initialData, token }: Props) {
  // Strapi datayı flattenStrapi ile döndürdüğü için direkt initialData'yı kullanabiliriz
  const settings = initialData || {};

  const [siteName, setSiteName] = useState(settings.siteName || "");
  const [ogTitle, setOgTitle] = useState(settings.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(settings.ogDescription || "");
  const [keywords, setKeywords] = useState(settings.keywords || "");

  const [heroBadge, setHeroBadge] = useState(settings.heroBadge || "");
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle || "");
  const [heroDescription, setHeroDescription] = useState(settings.heroDescription || "");
  
  const [floatingBadgeTop, setFloatingBadgeTop] = useState(settings.floatingBadgeTop || "");
  const [floatingBadgeBottom, setFloatingBadgeBottom] = useState(settings.floatingBadgeBottom || "");
  
  const [heroBtn1Text, setHeroBtn1Text] = useState(settings.heroBtn1Text || "");
  const [heroBtn1Link, setHeroBtn1Link] = useState(settings.heroBtn1Link || "");
  const [heroBtn2Text, setHeroBtn2Text] = useState(settings.heroBtn2Text || "");
  const [heroBtn2Link, setHeroBtn2Link] = useState(settings.heroBtn2Link || "");

  const [footerTitle, setFooterTitle] = useState(settings.footer_title || "");
  const [footerDescription, setFooterDescription] = useState(settings.footer_description || "");
  
  // Logos state: array of { id, url, file? }
  const [logos, setLogos] = useState<any[]>(() => {
    if (Array.isArray(settings.logo)) return settings.logo;
    if (settings.logo) return [settings.logo];
    return [];
  });
  
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }





  async function handleSave() {
    setSaving(true);
    try {
      const finalLogoIds: number[] = [];

      for (const logoItem of logos) {
        if (logoItem.file) {
          // New file to upload
          const formData = new FormData();
          formData.append("files", logoItem.file);
          const uploadRes = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData[0]) {
            finalLogoIds.push(uploadData[0].id);
          }
        } else if (logoItem.id) {
          // Existing file
          finalLogoIds.push(logoItem.id);
        }
      }

      const payload = {
        heroBadge,
        heroTitle,
        heroDescription,
        floatingBadgeTop,
        floatingBadgeBottom,
        heroBtn1Text,
        heroBtn1Link,
        heroBtn2Text,
        heroBtn2Link,
        siteName,
        ogTitle,
        ogDescription,
        keywords,
        footer_title: footerTitle,
        footer_description: footerDescription,
        logo: finalLogoIds
      };

      const _rawRes = await fetch("/api/admin/global-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await _rawRes.json();
      const res = { ok: _rawRes.ok, status: _rawRes.status, data };
      
      if (res.ok) {
        showToast("Site içerikleri başarıyla güncellendi ✓");
      } else {
        console.error("Save error details:", res.status, res.data);
        showToast("Hata: " + (res.data?.error?.message || "Bilinmeyen hata"), "error");
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
          
          {/* Section: Hero Bölümü */}
          <div className="info-card">
            <div className="card-title"><span className="ms">view_quilt</span> Hero Bölümü</div>
            
            <div className="form-group">
              <label>BADGE METNİ (KÜÇÜK ETİKET)</label>
              <input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="✨ Türkiye'nin #1 Ücretsiz Eğitim Platformu" />
            </div>

            <div className="form-group">
              <label>BAŞLIK (Renkli kısmı &lt; ve &gt; içine alın)</label>
              <textarea value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="<TYT & AYT'ye>\nHazırlanmanın\nEn Akıllı Yolu" rows={3} />
            </div>

            <div className="form-group">
              <label>AÇIKLAMA METNİ</label>
              <textarea value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} placeholder="Alanında uzman youtuber öğretmenlerle sınava hazırlan..." rows={4} />
            </div>
          </div>

          {/* Section: SEO Ayarları */}
          <div className="info-card" style={{ borderTop: "4px solid #10b981" }}>
            <div className="card-title" style={{ color: "#10b981" }}><span className="ms">search</span> SEO & Genel Ayarlar</div>
            
            <div className="form-group">
              <label>SİTE ADI</label>
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Örn: Ders Platosu" />
            </div>

            <div className="form-group">
              <label>VARSAYILAN SEO BAŞLIĞI (TITLE)</label>
              <input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Örn: Ders Platosu - TYT AYT Hazırlık" />
            </div>

            <div className="form-group">
              <label>VARSAYILAN META AÇIKLAMASI (DESCRIPTION)</label>
              <textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} placeholder="Sitenin arama sonuçlarında görünecek açıklaması..." rows={3} />
            </div>

            <div className="form-group">
              <label>ANAHTAR KELİMELER (KEYWORDS - Virgül ile ayırın)</label>
              <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="ders platosu, tyt, ayt, sınav hazırlık..." rows={2} />
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Section: Yüzen Etiketler */}
          <div className="info-card">
            <div className="card-title" style={{ color: "#fbbf24" }}><span className="ms">auto_awesome</span> Yüzen Etiketler</div>
            
            <div className="form-group">
              <label>ÜST ETİKET</label>
              <input value={floatingBadgeTop} onChange={(e) => setFloatingBadgeTop(e.target.value)} placeholder="🎁 Ücretsiz!" />
            </div>

            <div className="form-group">
              <label>ALT ETİKET</label>
              <input value={floatingBadgeBottom} onChange={(e) => setFloatingBadgeBottom(e.target.value)} placeholder="İşler Yayın Grubu Katkıları İle" />
            </div>
          </div>

          {/* Section: Butonlar */}
          <div className="info-card">
            <div className="card-title"><span className="ms">ads_click</span> Butonlar</div>
            
            <div style={{ borderBottom: "1px solid var(--border)", marginBottom: "15px", paddingBottom: "15px" }}>
              <div className="form-group">
                <label>ANA BUTON METNİ</label>
                <input value={heroBtn1Text} onChange={(e) => setHeroBtn1Text(e.target.value)} placeholder="Örn: Kamplarımız" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>ANA BUTON LİNKİ</label>
                <input value={heroBtn1Link} onChange={(e) => setHeroBtn1Link(e.target.value)} placeholder="Örn: #dersler" />
              </div>
            </div>

            <div className="form-group">
              <label>İKİNCİ BUTON METNİ</label>
              <input value={heroBtn2Text} onChange={(e) => setHeroBtn2Text(e.target.value)} placeholder="Örn: Kitaplarımız" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>İKİNCİ BUTON LİNKİ</label>
              <input value={heroBtn2Link} onChange={(e) => setHeroBtn2Link(e.target.value)} placeholder="Örn: /kitaplar" />
            </div>
          </div>

          {/* Section: Footer Marka */}
          <div className="info-card" style={{ borderTop: "4px solid #8b5cf6", marginTop: "20px" }}>
            <div className="card-title" style={{ color: "#8b5cf6" }}><span className="ms">footer</span> Footer Marka Bilgileri</div>
            
            <div className="form-group">
              <label>FOOTER BAŞLIK (LOGO YANI)</label>
              <input value={footerTitle} onChange={(e) => setFooterTitle(e.target.value)} placeholder="Örn: Ders Platosu" />
            </div>

            <div className="form-group">
              <label>FOOTER AÇIKLAMA METNİ</label>
              <textarea value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} placeholder="Sitenin en altındaki açıklama metni..." rows={3} />
            </div>

            <div className="form-group">
              <label>SİTE LOGOLARI (Birden fazla seçilebilir)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px", marginTop: "10px" }}>
                {logos.map((logo, idx) => (
                  <div key={idx} style={{ position: "relative", width: "80px", height: "80px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <img 
                      src={logo.url.startsWith("blob") ? logo.url : (process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340") + logo.url} 
                      alt="Logo" 
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} 
                    />
                    <button 
                      onClick={() => setLogos(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(239,68,68,0.8)", border: "none", color: "white", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <span className="ms" style={{ fontSize: "14px" }}>close</span>
                    </button>
                  </div>
                ))}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newLogos = files.map(file => ({
                      url: URL.createObjectURL(file),
                      file
                    }));
                    setLogos(prev => [...prev, ...newLogos]);
                  }} 
                  style={{ display: "none" }} 
                  id="logo-upload-multi"
                />
                <label htmlFor="logo-upload-multi" style={{ width: "80px", height: "80px", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                  <span className="ms">add</span>
                  <span style={{ fontSize: "10px" }}>Ekle</span>
                </label>
              </div>
            </div>
          </div>



        </div>
      </div>
    </div>
  );
}

export default SiteForm;
