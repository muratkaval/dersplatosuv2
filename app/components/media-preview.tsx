"use client";

import { useState, useEffect } from "react";

export default function MediaPreview({
  url,
  type,
  label = "İncele",
  children,
}: {
  url: string;
  type: "image" | "pdf";
  label?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {children ? (
        <span onClick={() => setOpen(true)} style={{ cursor: "zoom-in", display: "block" }}>
          {children}
        </span>
      ) : (
        <button type="button" className="btn-outline" onClick={() => setOpen(true)}>
          {label}
        </button>
      )}

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", flexDirection: "column", padding: "20px", gap: "12px" }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }} onClick={(e) => e.stopPropagation()}>
            <a href={url} target="_blank" rel="noopener noreferrer" download className="btn-primary">İndir</a>
            <button type="button" onClick={() => setOpen(false)} className="btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}>
              Kapat ✕
            </button>
          </div>
          <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
            {type === "image" ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={url} alt="Önizleme" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "8px" }} />
            ) : (
              <iframe src={url} title="PDF önizleme" style={{ width: "100%", height: "100%", border: 0, borderRadius: "8px", background: "#fff" }} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
