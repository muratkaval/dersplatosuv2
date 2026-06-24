"use client";

import { useState, useEffect } from "react";

type Props = {
  index: number;
  weekNo?: number;
  title?: string;
  img?: string;
  pdf?: string;
  link?: string;
  unitWord: string;
};

// Full-width week card with an inline preview that expands downward (accordion).
// No modal/popup — works reliably on mobile and avoids fixed-position clipping
// issues inside transformed/overflow-hidden card containers.
export default function WeekCard({ index, weekNo, title, img, pdf, link, unitWord }: Props) {
  const [open, setOpen] = useState(false);
  // Mobil tarayıcılar PDF'i iframe içinde render etmez (boş/bozuk kutu çıkar);
  // bu yüzden mobilde gömülü önizleme yerine "tam ekran aç" kartı gösteririz.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const label = title || `${weekNo || index + 1}. ${unitWord}`;
  // Prefer PDF for the inline preview ("tüm alan PDF olarak açılsın"); fall back
  // to the schedule image when there is no PDF.
  const previewSrc = pdf || img || "";
  const previewType: "image" | "pdf" | null = pdf ? "pdf" : img ? "image" : null;
  const hasAny = Boolean(img || pdf || link);

  return (
    <div className={`week-card${open ? " open" : ""}`}>
      <div className="week-head">
        <div className="week-head-left">
          <span className="week-badge">{label}</span>
        </div>
        <div className="week-actions">
          {previewType && (
            isMobile && previewType === "pdf" ? (
              // Mobilde PDF doğrudan yeni sekmede açılsın — ara "Tam ekran aç" adımı yok
              <a
                href={previewSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <span className="ms">visibility</span>
                Önizle
              </a>
            ) : (
              <button
                type="button"
                className="btn-outline"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
              >
                <span className="ms">{open ? "expand_less" : "visibility"}</span>
                {open ? "Kapat" : "Önizle"}
              </button>
            )
          )}
          {pdf && (
            <a href={pdf} target="_blank" rel="noopener noreferrer" download className="btn-danger">
              <span className="ms">download</span> PDF İndir
            </a>
          )}
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <span className="ms">open_in_new</span> Bağlantı
            </a>
          )}
          {!hasAny && <span className="week-empty">İçerik eklenmemiş</span>}
        </div>
      </div>

      {previewType && (
        <div className="week-preview" aria-hidden={!open}>
          <div className="week-preview-inner">
            <div className="week-preview-pad">
              {/* Heavy media mounts only when opened — saves mobile data. */}
              {open &&
                (previewType === "image" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewSrc} alt={label} className="week-preview-img" />
                ) : isMobile ? (
                  <div className="week-preview-doc">
                    <span className="ms week-preview-doc-icon">picture_as_pdf</span>
                    <p className="week-preview-doc-hint">
                      Programı tam ekranda büyük ve net gör — yakınlaştırıp rahatça inceleyebilirsin.
                    </p>
                    <a
                      href={previewSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary week-preview-open"
                    >
                      <span className="ms">open_in_new</span> Tam ekran aç
                    </a>
                  </div>
                ) : (
                  <div className="week-preview-pdf">
                    <iframe src={previewSrc} title={label} />
                    <a
                      href={previewSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary week-preview-open"
                    >
                      <span className="ms">open_in_new</span> Tam ekran / yeni sekmede aç
                    </a>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
