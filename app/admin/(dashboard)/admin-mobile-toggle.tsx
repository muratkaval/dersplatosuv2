"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Mobil (off-canvas) sidebar için hamburger düğmesi + arka plan.
// body'ye "admin-sidebar-open" sınıfı ekleyip CSS'in sidebar'ı kaydırmasını sağlar.
export default function AdminMobileToggle() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.toggle("admin-sidebar-open", open);
    return () => document.body.classList.remove("admin-sidebar-open");
  }, [open]);

  // Sayfa değişince (bir nav linkine tıklanınca) sidebar'ı kapat.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="admin-mobile-toggle"
        aria-label="Menüyü aç/kapat"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ms">{open ? "close" : "menu"}</span>
      </button>
      <div className="admin-sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden />
    </>
  );
}
