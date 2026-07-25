"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { toMediaUrl } from "@/app/lib/strapi";

export interface PopupConfig {
  enabled?: boolean;
  image?: any;          // Strapi media objesi
  imageAlt?: string;
  link?: string;
  linkNewTab?: boolean;
  scope?: "home" | "all";
  frequency?: "session" | "daily" | "always";
}

const SEEN_KEY = "dp_popup_seen";

export function SitePopup({ popup }: { popup?: PopupConfig | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const enabled = !!popup?.enabled;
  const imageUrl = popup?.image ? toMediaUrl(popup.image) : "";
  const scope = popup?.scope || "home";
  const frequency = popup?.frequency || "session";
  const link = popup?.link || "";
  const newTab = !!popup?.linkNewTab;

  useEffect(() => setMounted(true), []);

  // Sıklık kapısı: aynı görsel + sıklık penceresi içinde ise gösterme.
  // Görsel değişince (yeni kampanya) daha önce görmüş olsa bile tekrar gösterilir.
  function shouldShow(): boolean {
    if (frequency === "always") return true;
    try {
      const store = frequency === "session" ? window.sessionStorage : window.localStorage;
      const raw = store.getItem(SEEN_KEY);
      if (!raw) return true;
      const { img, ts } = JSON.parse(raw);
      if (img !== imageUrl) return true; // yeni görsel → tekrar göster
      if (frequency === "session") return false;
      if (frequency === "daily") {
        return new Date(Number(ts)).toDateString() !== new Date().toDateString();
      }
      return true;
    } catch {
      return true;
    }
  }

  function markSeen() {
    if (frequency === "always") return;
    try {
      const store = frequency === "session" ? window.sessionStorage : window.localStorage;
      store.setItem(SEEN_KEY, JSON.stringify({ img: imageUrl, ts: Date.now() }));
    } catch {}
  }

  useEffect(() => {
    if (!enabled || !imageUrl) return;
    if (scope === "home" && pathname !== "/") return;
    if (!shouldShow()) return;
    const t = setTimeout(() => {
      setOpen(true);
      markSeen();
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, imageUrl, scope, frequency, pathname]);

  // Açıkken: ESC ile kapat + arka planı kilitle
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!mounted || !open || !imageUrl) return null;

  // Kritik konumlandırma inline — harici CSS derlemesine/ata-transform'a bağımlı DEĞİL.
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "rgba(0,0,0,0.72)",
    animation: "dpPopupFade 0.25s ease",
  };
  const cardStyle: React.CSSProperties = {
    position: "relative",
    maxWidth: "min(92vw, 560px)",
    maxHeight: "88vh",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    animation: "dpPopupPop 0.3s cubic-bezier(0.16,1,0.3,1)",
  };
  const imgStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    height: "auto",
    maxHeight: "88vh",
    objectFit: "contain",
  };
  const closeStyle: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: "22px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 2,
  };

  const img = <img src={imageUrl} alt={popup?.imageAlt || "Duyuru"} style={imgStyle} />;

  const overlay = (
    <div style={overlayStyle} onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Duyuru">
      <style>{`@keyframes dpPopupFade{from{opacity:0}to{opacity:1}}@keyframes dpPopupPop{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeStyle} onClick={() => setOpen(false)} aria-label="Kapat" type="button">×</button>
        {link ? (
          <a
            href={link}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
            onClick={() => setOpen(false)}
            style={{ display: "block", cursor: "pointer" }}
          >
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
