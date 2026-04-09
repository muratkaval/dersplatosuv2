"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { section: "İçerik" },
  { href: "/admin/kamplar", icon: "camping", label: "Kamplar" },
  { href: "/admin/kitaplar", icon: "menu_book", label: "Kitaplar" },
  { href: "/admin/soru-cozumleri", icon: "play_circle", label: "Soru Çözümleri" },
  { href: "/admin/egitimciler", icon: "supervisor_account", label: "Eğitimciler" },
  { section: "Kategoriler" },
  { href: "/admin/kategoriler", icon: "local_offer", label: "Kategoriler" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav">
      {navItems.map((item, i) => {
        if ("section" in item) {
          return <div key={i} className="nav-section">{item.section}</div>;
        }
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${isActive ? "active" : ""}`}
          >
            <span className="ms">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
