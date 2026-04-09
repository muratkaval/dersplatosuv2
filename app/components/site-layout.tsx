"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sadece basit bir mounted logic
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.body.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if(newTheme) {
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
          <img src="https://i.hizliresim.com/ag3gf4d.png" className="logo-img" alt="Ders Platosu" />
          <span className="logo-text">Ders Platosu</span>
        </Link>
        <ul className="nav-links">
          <li><Link href="/" className="nav-link">Ana Sayfa</Link></li>
          <li><Link href="/youtuber-hocalar" className="nav-link">Youtuber Hocalarımız</Link></li>
          <li><Link href="/kamplar" className="nav-link">Kamplar</Link></li>
          <li><Link href="/kitaplar" className="nav-link">Kitaplarımız</Link></li>
          <li><Link href="/video-soru-cozumleri" className="nav-link">Soru Çözümleri</Link></li>
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
                   <line x1="12" y1="1" x2="12" y2="3" />
                   <line x1="12" y1="21" x2="12" y2="23" />
                   <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                   <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                   <line x1="1" y1="12" x2="3" y2="12" />
                   <line x1="21" y1="12" x2="23" y2="12" />
                   <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                   <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
          <Link href="/">Ana Sayfa</Link>
          <Link href="/youtuber-hocalar">Youtuber Hocalarımız</Link>
          <Link href="/kamplar">Kamplar</Link>
          <Link href="/kitaplar">Kitaplarımız</Link>
          <Link href="/video-soru-cozumleri">Soru Çözümleri</Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="nav-logo" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="https://i.hizliresim.com/ag3gf4d.png" className="logo-img" alt="Ders Platosu" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
              <span className="logo-text" style={{ fontWeight: '800', fontSize: '1.3rem' }}>Ders Platosu</span>
            </Link>
            <p style={{ marginTop: '14px', color: 'var(--text-muted)' }}>Türkiye'nin en büyük ücretsiz TYT ve AYT eğitim platformu.</p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <Link href="/">Ana Sayfa</Link>
            <Link href="/youtuber-hocalar">Youtuber Hocalarımız</Link>
            <Link href="/kitaplar">Kitaplarımız</Link>
          </div>
          <div className="footer-col">
            <h4>Hizmetler</h4>
            <Link href="/kamplar">Kamplar</Link>
            <Link href="/video-soru-cozumleri">Soru Çözümleri</Link>
          </div>
          <div className="footer-col">
            <h4>İletişim</h4>
            <a href="mailto:info@dersplatosu.com">info@dersplatosu.com</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© Tüm hakları saklıdır. <a href="https://kvl.com.tr/" target="_blank" rel="noopener">KVL Digital</a> Tarafından Geliştirilmiştir.</p>
        </div>
      </div>
    </footer>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}

