"use client";

import { useState, useEffect } from "react";

/**
 * Rota detayindaki PDF eylemleri: Onizle + Indir.
 *
 * Mobil tarayicilar PDF'i iframe icinde render etmiyor (bos/bozuk kutu cikiyor),
 * bu yuzden mobilde gomulu onizleme yerine dogrudan yeni sekmede aciliyor.
 * Programlar sayfasindaki week-card ile ayni davranis.
 */
export default function PdfOnizleme({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const dosyaAdi = `${title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "program"}.pdf`;

  return (
    <>
      <div className="cd-detail-actions">
        {isMobile ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="cd-btn cd-btn-ghost">
            <span className="ms">visibility</span> Önizle
          </a>
        ) : (
          <button
            type="button"
            className="cd-btn cd-btn-ghost"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            <span className="ms">{open ? "expand_less" : "visibility"}</span>
            {open ? "Önizlemeyi Kapat" : "Önizle"}
          </button>
        )}

        <a
          href={url}
          download={dosyaAdi}
          target="_blank"
          rel="noopener noreferrer"
          className="cd-btn cd-btn-primary"
        >
          <span className="ms">download</span> Programı PDF Olarak İndir
        </a>
      </div>

      {open && !isMobile && (
        <div className="cd-pdf-onizleme">
          <iframe src={url} title={`${title} önizleme`} />
          <a href={url} target="_blank" rel="noopener noreferrer" className="cd-btn cd-btn-ghost">
            <span className="ms">open_in_new</span> Tam ekran / yeni sekmede aç
          </a>
        </div>
      )}
    </>
  );
}
