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

  // Form states
  const [heroBadge, setHeroBadge] = useState(settings.heroBadge || "");
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle || "");
  const [heroDescription, setHeroDescription] = useState(settings.heroDescription || "");
  
  const [floatingBadgeTop, setFloatingBadgeTop] = useState(settings.floatingBadgeTop || "");
  const [floatingBadgeBottom, setFloatingBadgeBottom] = useState(settings.floatingBadgeBottom || "");
  
  const [heroBtn1Text, setHeroBtn1Text] = useState(settings.heroBtn1Text || "");
  const [heroBtn1Link, setHeroBtn1Link] = useState(settings.heroBtn1Link || "");
  const [heroBtn2Text, setHeroBtn2Text] = useState(settings.heroBtn2Text || "");
  const [heroBtn2Link, setHeroBtn2Link] = useState(settings.heroBtn2Link || "");






  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }





  async function handleSave() {
    setSaving(true);
    try {
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



        </div>
      </div>
    </div>
  );
}

export default SiteForm;
