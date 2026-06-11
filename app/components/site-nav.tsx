"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toMediaUrl } from "@/app/lib/strapi";

export interface NavLink { label: string; href: string; }
export interface FooterColumn { title: string; links: NavLink[]; }

const DEFAULT_NAV: NavLink[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Youtuber Hocalarımız", href: "/youtuber-hocalar" },
  { label: "Kamplar", href: "/kamplar" },
  { label: "Programlar", href: "/programlar" },
  { label: "Kitaplarımız", href: "/kitaplar" },
  { label: "Soru Çözümleri", href: "/video-soru-cozumleri" },
];

const DEFAULT_FOOTER: FooterColumn[] = [
  {
    title: "Platform",
    links: [
      { label: "Ana Sayfa", href: "/" },
      { label: "Youtuber Hocalarımız", href: "/youtuber-hocalar" },
      { label: "Kitaplarımız", href: "/kitaplar" },
    ]
  },
  {
    title: "Hizmetler",
    links: [
      { label: "Kamplar", href: "/kamplar" },
      { label: "Soru Çözümleri", href: "/video-soru-cozumleri" },
    ]
  },
  {
    title: "İletişim",
    links: [
      { label: "info@dersplatosu.com", href: "mailto:info@dersplatosu.com" },
    ]
  },
];

export function SiteHeader({ navLinks: propLinks }: { navLinks?: NavLink[] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [navLinks, setNavLinks] = useState<NavLink[]>(propLinks || DEFAULT_NAV);
  const [logos, setLogos] = useState<any[]>([]);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.body.setAttribute('data-theme', 'dark');
    }
    if (!propLinks) {
      fetch("/api/nav").then(r => r.json()).then(d => {
        if (d?.navLinks?.length) setNavLinks(d.navLinks);
        if (d?.logo) {
          setLogos(Array.isArray(d.logo) ? d.logo : [d.logo]);
        }
      }).catch(() => {});
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <nav className={`navbar ${isMobileMenuOpen ? 'mobile-open' : ''}`} id="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          <img
            src={logos.length > 0 ? toMediaUrl(logos[0]) : "https://i.hizliresim.com/ag3gf4d.png"}
            className="logo-img"
            alt="Ders Platosu"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://i.hizliresim.com/ag3gf4d.png";
            }}
          />
          <span className="logo-text">Ders Platosu</span>
        </Link>
        <ul className="nav-links">
          {navLinks.map((l, i) => (
            <li key={i}><Link href={l.href} className="nav-link">{l.label}</Link></li>
          ))}
        </ul>
        <div className="nav-actions">
          <button className="btn-icon" onClick={toggleTheme} title="Tema Değiştir">
            {isDark ? (
              <svg className="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg className="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
        </div>
        <button
          className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        {navLinks.map((l, i) => <Link key={i} href={l.href}>{l.label}</Link>)}
      </div>
    </nav>
  );
}

export function SiteFooter({ footerColumns: propCols }: { footerColumns?: FooterColumn[] }) {
  const [cols, setCols] = useState<FooterColumn[]>(propCols || DEFAULT_FOOTER);
  const [footerTitle, setFooterTitle] = useState("Ders Platosu");
  const [footerDescription, setFooterDescription] = useState("Türkiye'nin en büyük ücretsiz TYT ve AYT eğitim platformu.");
  const [logos, setLogos] = useState<any[]>([]);

  useEffect(() => {
    if (!propCols) {
      fetch("/api/nav").then(r => r.json()).then(d => {
        if (d?.footerColumns?.length) setCols(d.footerColumns);
        if (d?.footer_title) setFooterTitle(d.footer_title);
        if (d?.footer_description) setFooterDescription(d.footer_description);
        if (d?.logo) {
          setLogos(Array.isArray(d.logo) ? d.logo : [d.logo]);
        }
      }).catch(() => {});
    }
  }, []);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
              {logos.length > 0 ? (
                logos.map((l, i) => (
                  <img
                    key={i}
                    src={toMediaUrl(l)}
                    alt="Logo"
                    style={{ height: '32px', width: 'auto', borderRadius: '4px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://i.hizliresim.com/ag3gf4d.png";
                      (e.target as HTMLImageElement).style.width = "32px";
                    }}
                  />
                ))
              ) : (
                <img src="https://i.hizliresim.com/ag3gf4d.png" className="logo-img" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
              )}
              <span className="logo-text" style={{ fontWeight: '800', fontSize: '1.2rem', marginLeft: "4px" }}>{footerTitle}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: "0.95rem", lineHeight: "1.5" }}>{footerDescription}</p>
          </div>
          {cols.map((col, ci) => (
            <div key={ci} className="footer-col">
              <h4>{col.title}</h4>
              {col.links.map((l, li) => (
                <Link key={li} href={l.href}>{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>© Tüm hakları saklıdır. <a href="https://kvl.com.tr/" target="_blank" rel="noopener">KVL Digital</a> Tarafından Geliştirilmiştir.</p>
        </div>
      </div>
    </footer>
  );
}
