"use client";

import { useState } from "react";
// import removed, using nextjs api route now

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface Props {
  initialData: any;
  token: string;
  campOptions?: any[];
  bookOptions?: any[];
  programOptions?: any[];
  instructorOptions?: any[];
}

export function SiteForm({ initialData, token, campOptions = [], bookOptions = [], programOptions = [], instructorOptions = [] }: Props) {
  // Strapi datayı flattenStrapi ile döndürdüğü için direkt initialData'yı kullanabiliriz
  const settings = initialData || {};

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

  // Hero vitrin slaytları (her satır _uid ile; kayıtta temizlenir).
  // İlk (kayıtlı) slaytlara DETERMİNİSTİK _uid ver (s0, s1...) ki SSR ve client
  // aynı olsun (uid()=Math.random() SSR'de hydration uyumsuzluğu yaratıyordu).
  // Sonradan eklenenler uid() alır — onlar yalnız client'ta çalışır, sorun olmaz.
  const [heroSlides, setHeroSlides] = useState<any[]>(() =>
    Array.isArray(settings.heroSlides) ? settings.heroSlides.map((s: any, i: number) => ({ ...s, _uid: `s${i}` })) : []
  );
  const [heroRotateSeconds, setHeroRotateSeconds] = useState<string>(
    settings.heroRotateSeconds ? String(settings.heroRotateSeconds) : "6"
  );
  // Varsayılan: tüm satırlar AÇIK (alanlar hemen görünsün). Sadece kapatılanlar burada tutulur.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // İki kademeli içerik seçici: önce tür, sonra o türün öğeleri.
  const [cardType, setCardType] = useState<Record<string, string>>({});
  const [addType, setAddType] = useState<string>("");
  function toggleOpen(u: string) {
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(u)) n.delete(u); else n.add(u);
      return n;
    });
  }

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addSlideFrom(opt: any) {
    if (!opt) return;
    const { id: _id, ...slide } = opt;
    setHeroSlides((p) => [...p, { ...slide, _uid: uid() }]);
  }
  function addCustomSlide() {
    setHeroSlides((p) => [...p, { kind: "Özel", eyebrow: "", title: "", description: "", btn1Text: "", btn1Link: "", btn2Text: "", btn2Link: "", subtitle: "", badge: "", image: "", imageLink: "", link: "", _uid: uid() }]);
  }
  // Sağ kartı bir kamp/kitap/öğretmen/program içeriğiyle doldurur (sol metni/butonları değiştirmez).
  function setCardFromEntity(u: string, opt: any) {
    if (!opt) return;
    setHeroSlides((p) => p.map((s) => (s._uid === u ? { ...s, kind: opt.kind, image: opt.image || "", imageLink: opt.imageLink || opt.link || "", subtitle: opt.subtitle || "", badge: opt.badge || "", _imageFile: undefined } : s)));
  }
  // İki kademeli seçici: türe göre öğe listesi + tür etiketi.
  function optionsFor(type: string): any[] {
    return type === "kamp" ? campOptions : type === "kitap" ? bookOptions : type === "ogretmen" ? instructorOptions : type === "program" ? programOptions : [];
  }
  function labelFor(type: string): string {
    return type === "kamp" ? "Kamp" : type === "kitap" ? "Kitap" : type === "ogretmen" ? "Öğretmen" : type === "program" ? "Program" : "";
  }
  function removeSlide(u: string) {
    setHeroSlides((p) => p.filter((s) => s._uid !== u));
  }
  function updateSlide(u: string, field: string, val: string) {
    setHeroSlides((p) => p.map((s) => (s._uid === u ? { ...s, [field]: val } : s)));
  }
  function setSlideImageUrl(u: string, url: string) {
    setHeroSlides((p) => p.map((s) => (s._uid === u ? { ...s, image: url, _imageFile: undefined } : s)));
  }
  function setSlideImageFile(u: string, file: File) {
    const blob = URL.createObjectURL(file);
    setHeroSlides((p) => p.map((s) => (s._uid === u ? { ...s, image: blob, _imageFile: file } : s)));
  }
  function moveSlide(u: string, dir: number) {
    setHeroSlides((p) => {
      const i = p.findIndex((s) => s._uid === u);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  const selStyle: React.CSSProperties = { padding: "8px 10px", borderRadius: "6px", background: "#0b1530", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "inherit", fontSize: "0.82rem", cursor: "pointer" };
  const optStyle: React.CSSProperties = { background: "#0b1530", color: "#e2e8f0" };
  const fieldStyle: React.CSSProperties = { width: "100%", padding: "9px 11px", background: "#0b1530", border: "1px solid rgba(255,255,255,0.14)", color: "#e2e8f0", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.85rem", outline: "none" };





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

      // Hero slaytları: bekleyen görselleri yükle, geçici alanları temizle
      const cleanSlides = [];
      for (const s of heroSlides) {
        let image = s.image && !String(s.image).startsWith("blob") ? s.image : "";
        if (s._imageFile) {
          const fd = new FormData();
          fd.append("files", s._imageFile);
          const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
          const upData = await up.json();
          if (up.ok && upData[0]) image = upData[0].url;
        }
        cleanSlides.push({
          kind: s.kind || "Özel",
          eyebrow: s.eyebrow || "",
          title: s.title || "",
          description: s.description || "",
          btn1Text: s.btn1Text || "",
          btn1Link: s.btn1Link || "",
          btn2Text: s.btn2Text || "",
          btn2Link: s.btn2Link || "",
          subtitle: s.subtitle || "",
          badge: s.badge || "",
          image,
          imageLink: s.imageLink || "",
          link: s.link || "",
        });
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
        footer_title: footerTitle,
        footer_description: footerDescription,
        logo: finalLogoIds,
        heroSlides: cleanSlides,
        heroRotateSeconds: Number(heroRotateSeconds) || 6,
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

          {/* Section: Hero Slayt Gösterisi (Vitrin) */}
          <div className="info-card" style={{ borderTop: "4px solid #2563eb" }}>
            <div className="card-title"><span className="ms">view_carousel</span> Hero Slayt Gösterisi (Vitrin)</div>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "-4px 0 4px" }}>
              Her slayt tüm hero alanını kaplar (üst etiket + başlık + açıklama + iki buton + sağ görsel) ve aralarında otomatik döner. Alttan Kamp/Kitap/Program seç (otomatik dolar) ya da Özel ekle; sonra satırı açıp her şeyi düzenle. Hiç slayt yoksa eski statik hero gösterilir.
            </p>

            <div className="form-group" style={{ maxWidth: "180px" }}>
              <label>DÖNME SÜRESİ (saniye)</label>
              <input type="number" min={2} value={heroRotateSeconds} onChange={(e) => setHeroRotateSeconds(e.target.value)} placeholder="6" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {heroSlides.length === 0 ? (
                <div style={{ fontSize: "0.82rem", color: "#94a3b8", padding: "6px 0" }}>Henüz slayt eklenmedi.</div>
              ) : (
                heroSlides.map((s, idx) => {
                  const preview = s.image ? (String(s.image).startsWith("blob") || String(s.image).startsWith("http") ? s.image : (process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340") + s.image) : "";
                  const open = !collapsed.has(s._uid);
                  const grpLabel: React.CSSProperties = { fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700 };
                  return (
                    <div key={s._uid} style={{ border: "1px solid var(--border)", borderRadius: "10px", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#93c5fd", background: "rgba(59,130,246,0.14)", padding: "3px 9px", borderRadius: "6px", flexShrink: 0 }}>{s.kind || "Özel"}</span>
                        <span style={{ flex: 1, fontSize: "0.85rem", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title || "(başlıksız slayt)"}</span>
                        <button type="button" onClick={() => moveSlide(s._uid, -1)} disabled={idx === 0} className="btn btn-ghost btn-sm btn-icon"><span className="ms">arrow_upward</span></button>
                        <button type="button" onClick={() => moveSlide(s._uid, 1)} disabled={idx === heroSlides.length - 1} className="btn btn-ghost btn-sm btn-icon"><span className="ms">arrow_downward</span></button>
                        <button type="button" onClick={() => toggleOpen(s._uid)} className="btn btn-ghost btn-sm btn-icon"><span className="ms">{open ? "expand_less" : "expand_more"}</span></button>
                        <button type="button" onClick={() => removeSlide(s._uid)} className="btn btn-danger btn-sm btn-icon"><span className="ms">delete</span></button>
                      </div>

                      {open ? (
                        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={grpLabel}>SOL İÇERİK</label>
                            <input style={fieldStyle} value={s.eyebrow || ""} onChange={(e) => updateSlide(s._uid, "eyebrow", e.target.value)} placeholder="Üst etiket (örn: ✨ Yeni Kamp)" />
                            <textarea style={{ ...fieldStyle, resize: "vertical" }} value={s.title || ""} onChange={(e) => updateSlide(s._uid, "title", e.target.value)} placeholder="Başlık — renkli kısmı <...> içine al; Enter ile alt satır" rows={2} />
                            <textarea style={{ ...fieldStyle, resize: "vertical" }} value={s.description || ""} onChange={(e) => updateSlide(s._uid, "description", e.target.value)} placeholder="Açıklama (opsiyonel)" rows={2} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={grpLabel}>BUTONLAR</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input style={{ ...fieldStyle, flex: 1 }} value={s.btn1Text || ""} onChange={(e) => updateSlide(s._uid, "btn1Text", e.target.value)} placeholder="1. buton metni" />
                              <input style={{ ...fieldStyle, flex: 1 }} value={s.btn1Link || ""} onChange={(e) => updateSlide(s._uid, "btn1Link", e.target.value)} placeholder="1. buton link" />
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input style={{ ...fieldStyle, flex: 1 }} value={s.btn2Text || ""} onChange={(e) => updateSlide(s._uid, "btn2Text", e.target.value)} placeholder="2. buton metni (boş = gizli)" />
                              <input style={{ ...fieldStyle, flex: 1 }} value={s.btn2Link || ""} onChange={(e) => updateSlide(s._uid, "btn2Link", e.target.value)} placeholder="2. buton link" />
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={grpLabel}>SAĞ GÖRSEL KARTI</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginBottom: "2px" }}>
                              <span style={{ fontSize: "0.72rem", color: "#64748b", flexShrink: 0 }}>Hazır içerik:</span>
                              <select value={cardType[s._uid] || ""} onChange={(e) => setCardType((m) => ({ ...m, [s._uid]: e.target.value }))} style={selStyle}>
                                <option value="" style={optStyle}>Tür seç…</option>
                                <option value="kamp" style={optStyle}>Kamp</option>
                                <option value="kitap" style={optStyle}>Kitap</option>
                                <option value="ogretmen" style={optStyle}>Öğretmen</option>
                                <option value="program" style={optStyle}>Program</option>
                              </select>
                              {cardType[s._uid] ? (
                                <select defaultValue="" onChange={(e) => { const opt = optionsFor(cardType[s._uid]).find((x: any) => x.id === e.target.value); if (opt) setCardFromEntity(s._uid, opt); e.target.value = ""; }} style={{ ...selStyle, flex: 1, minWidth: "200px" }}>
                                  <option value="" style={optStyle}>{labelFor(cardType[s._uid])} seç…</option>
                                  {optionsFor(cardType[s._uid]).map((o: any) => <option key={o.id} value={o.id} style={optStyle}>{o.title}</option>)}
                                </select>
                              ) : null}
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <div style={{ width: "92px", height: "56px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {preview ? (
                                  <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <span className="ms" style={{ opacity: 0.3 }}>image</span>
                                )}
                              </div>
                              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  <input style={{ ...fieldStyle, flex: 1 }} value={s.image && !String(s.image).startsWith("blob") ? s.image : ""} onChange={(e) => setSlideImageUrl(s._uid, e.target.value)} placeholder="Görsel URL (veya yükle →)" />
                                  <input type="file" accept="image/*" id={`slide-img-${s._uid}`} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setSlideImageFile(s._uid, f); }} />
                                  <label htmlFor={`slide-img-${s._uid}`} className="btn btn-ghost btn-sm" style={{ cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}><span className="ms">upload</span> Yükle</label>
                                </div>
                                <input style={fieldStyle} value={s.imageLink || ""} onChange={(e) => updateSlide(s._uid, "imageLink", e.target.value)} placeholder="Kart linki (boş = 1. buton linki)" />
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input style={{ ...fieldStyle, flex: 1 }} value={s.subtitle || ""} onChange={(e) => updateSlide(s._uid, "subtitle", e.target.value)} placeholder="Kart alt yazısı (opsiyonel)" />
                              <input style={{ ...fieldStyle, width: "130px", flex: "0 0 auto" }} value={s.badge || ""} onChange={(e) => updateSlide(s._uid, "badge", e.target.value)} placeholder="Rozet" />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            <label style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, marginTop: "14px", marginBottom: "6px" }}>YENİ SLAYT EKLE</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <select value={addType} onChange={(e) => setAddType(e.target.value)} style={selStyle}>
                <option value="" style={optStyle}>Tür seç…</option>
                <option value="kamp" style={optStyle}>Kamp</option>
                <option value="kitap" style={optStyle}>Kitap</option>
                <option value="ogretmen" style={optStyle}>Öğretmen</option>
                <option value="program" style={optStyle}>Program</option>
              </select>
              {addType ? (
                <select defaultValue="" onChange={(e) => { const opt = optionsFor(addType).find((x: any) => x.id === e.target.value); if (opt) { addSlideFrom(opt); setAddType(""); } e.target.value = ""; }} style={{ ...selStyle, flex: 1, minWidth: "220px" }}>
                  <option value="" style={optStyle}>{labelFor(addType)} seç…</option>
                  {optionsFor(addType).map((o: any) => <option key={o.id} value={o.id} style={optStyle}>{o.title}</option>)}
                </select>
              ) : null}
              <button type="button" className="btn btn-ghost btn-sm" onClick={addCustomSlide}><span className="ms">add</span> Özel (boş) slayt</button>
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
