"use client";
import React from "react";
import Link from "next/link";

interface SettingsModule {
  id: string;
  title: string;
  desc: string;
  icon: string;
  href: string;
  color: string;
  active: boolean;
}

const settingsModules: SettingsModule[] = [
  {
    id: "seo",
    title: "SEO & Kod Yönetimi",
    desc: "Site başlığı, açıklama, anahtar kelimeler, Open Graph etiketleri ve analitik kodlar (GA4, GTM, Pixel).",
    icon: "language",
    href: "/admin/ayarlar/seo",
    color: "#3b82f6",
    active: true
  },
  {
    id: "site",
    title: "Site Düzenleme",
    desc: "Ana sayfa metinleri, buton etiketleri ve 'Neden Biz' gibi dinamik alanların yönetimi.",
    icon: "edit_square",
    href: "/admin/ayarlar/site",
    color: "#10b981",
    active: false
  },
  {
    id: "pages",
    title: "Sayfalar",
    desc: "KVKK, Gizlilik Politikası ve Kullanım Koşulları gibi statik metin sayfalarının yönetimi.",
    icon: "description",
    href: "#",
    color: "#a78bfa",
    active: false
  },
  {
    id: "alt-tags",
    title: "Görsel Alt Metinleri",
    desc: "Kitap ve kamp görselleri için SEO uyumlu alt metinlerin toplu yönetimi.",
    icon: "image_aspect_ratio",
    href: "#",
    color: "#fbbf24",
    active: false
  },
  {
    id: "navigation",
    title: "Header & Footer",
    desc: "Site ana menüsü ve alt bilgi (footer) linklerinin sürükle-bırak yöntemiyle yönetimi.",
    icon: "view_quilt",
    href: "#",
    color: "#6366f1",
    active: false
  },
  {
    id: "sitemap",
    title: "Sitemap Güncelle",
    desc: "Google botları için site haritasını (sitemap.xml) anlık olarak yeniden oluşturun.",
    icon: "account_tree",
    href: "#",
    color: "#f43f5e",
    active: false
  }
];

export default function SettingsDashboard() {
  return (
    <div className="settings-dashboard">
      <div className="topbar-title" style={{ marginBottom: "32px" }}>
        <h1><span className="ms">settings</span> Ayarlar</h1>
        <p>Sistem yapılandırması, güvenlik ve site yönetim merkezine hoş geldiniz.</p>
      </div>

      <div className="settings-grid">
        {settingsModules.map((m) => {
          const CardContent = (
            <React.Fragment key={`content-${m.id}`}>
              <div className="card-icon" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                <span className="ms">{m.icon}</span>
              </div>
              
              <div className="card-content">
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </div>

              <div className="card-footer">
                {m.active ? (
                  <div className="btn-open">
                    <span>Modülü Aç</span>
                    <span className="ms">arrow_forward</span>
                  </div>
                ) : (
                  <span className="badge-soon">YAKINDA</span>
                )}
              </div>
            </React.Fragment>
          );

          return m.active ? (
            <Link key={m.id} href={m.href} className="setting-card">
              {CardContent}
            </Link>
          ) : (
            <div key={m.id} className="setting-card coming-soon">
              {CardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
