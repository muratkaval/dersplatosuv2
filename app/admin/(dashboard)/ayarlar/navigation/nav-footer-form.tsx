"use client";

import { useState } from "react";

interface NavLink { id: string; label: string; href: string; }
interface FooterColumn { id: string; title: string; links: NavLink[]; }

interface Props { initialData: any; }

function uid() { return Math.random().toString(36).slice(2, 9); }

const DEFAULT_NAV: NavLink[] = [
  { id: uid(), label: "Ana Sayfa", href: "/" },
  { id: uid(), label: "Youtuber Hocalarımız", href: "/youtuber-hocalar" },
  { id: uid(), label: "Kamplar", href: "/kamplar" },
  { id: uid(), label: "Kitaplarımız", href: "/kitaplar" },
  { id: uid(), label: "Soru Çözümleri", href: "/video-soru-cozumleri" },
];

const DEFAULT_FOOTER: FooterColumn[] = [
  {
    id: uid(), title: "Platform",
    links: [
      { id: uid(), label: "Ana Sayfa", href: "/" },
      { id: uid(), label: "Youtuber Hocalarımız", href: "/youtuber-hocalar" },
      { id: uid(), label: "Kitaplarımız", href: "/kitaplar" },
    ]
  },
  {
    id: uid(), title: "Hizmetler",
    links: [
      { id: uid(), label: "Kamplar", href: "/kamplar" },
      { id: uid(), label: "Soru Çözümleri", href: "/video-soru-cozumleri" },
    ]
  },
  {
    id: uid(), title: "İletişim",
    links: [
      { id: uid(), label: "info@dersplatosu.com", href: "mailto:info@dersplatosu.com" },
    ]
  },
];

export default function NavFooterForm({ initialData }: Props) {
  const [navLinks, setNavLinks] = useState<NavLink[]>(
    initialData?.navLinks?.length ? initialData.navLinks.map((l: any) => ({ ...l, id: uid() })) : DEFAULT_NAV
  );
  const [footerCols, setFooterCols] = useState<FooterColumn[]>(
    initialData?.footerColumns?.length
      ? initialData.footerColumns.map((c: any) => ({ ...c, id: uid(), links: (c.links || []).map((l: any) => ({ ...l, id: uid() })) }))
      : DEFAULT_FOOTER
  );
  const [navSaving, setNavSaving] = useState(false);
  const [footerSaving, setFooterSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [dragNav, setDragNav] = useState<string | null>(null);
  const [dragLink, setDragLink] = useState<{ colId: string; linkId: string } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Nav helpers ──────────────────────────────────────────────
  function addNavLink() {
    setNavLinks(prev => [...prev, { id: uid(), label: "", href: "" }]);
  }

  function updateNavLink(id: string, field: "label" | "href", val: string) {
    setNavLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l));
  }

  function removeNavLink(id: string) {
    setNavLinks(prev => prev.filter(l => l.id !== id));
  }

  // ── Nav drag ────────────────────────────────────────────────
  function onNavDragStart(id: string) { setDragNav(id); }
  function onNavDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragNav || dragNav === targetId) return;
    setNavLinks(prev => {
      const from = prev.findIndex(l => l.id === dragNav);
      const to = prev.findIndex(l => l.id === targetId);
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  // ── Footer helpers ──────────────────────────────────────────
  function addFooterCol() {
    setFooterCols(prev => [...prev, { id: uid(), title: "Yeni Sütun", links: [] }]);
  }

  function removeFooterCol(colId: string) {
    setFooterCols(prev => prev.filter(c => c.id !== colId));
  }

  function updateColTitle(colId: string, val: string) {
    setFooterCols(prev => prev.map(c => c.id === colId ? { ...c, title: val } : c));
  }

  function addFooterLink(colId: string) {
    setFooterCols(prev => prev.map(c => c.id === colId ? { ...c, links: [...c.links, { id: uid(), label: "", href: "" }] } : c));
  }

  function updateFooterLink(colId: string, linkId: string, field: "label" | "href", val: string) {
    setFooterCols(prev => prev.map(c => c.id === colId
      ? { ...c, links: c.links.map(l => l.id === linkId ? { ...l, [field]: val } : l) }
      : c
    ));
  }

  function removeFooterLink(colId: string, linkId: string) {
    setFooterCols(prev => prev.map(c => c.id === colId ? { ...c, links: c.links.filter(l => l.id !== linkId) } : c));
  }

  // ── Footer link drag ─────────────────────────────────────────
  function onLinkDragStart(colId: string, linkId: string) { setDragLink({ colId, linkId }); }
  function onLinkDragOver(e: React.DragEvent, colId: string, targetLinkId: string) {
    e.preventDefault();
    if (!dragLink || dragLink.linkId === targetLinkId || dragLink.colId !== colId) return;
    setFooterCols(prev => prev.map(c => {
      if (c.id !== colId) return c;
      const from = c.links.findIndex(l => l.id === dragLink.linkId);
      const to = c.links.findIndex(l => l.id === targetLinkId);
      const next = [...c.links];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...c, links: next };
    }));
  }

  // ── Save ────────────────────────────────────────────────────
  async function saveNav() {
    setNavSaving(true);
    try {
      const payload = { navLinks: navLinks.map(({ label, href }) => ({ label, href })) };
      const res = await fetch("/api/admin/global-setting", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) showToast("Navigasyon kaydedildi ✓");
      else showToast("Hata oluştu", "error");
    } catch { showToast("Bağlantı hatası", "error"); }
    finally { setNavSaving(false); }
  }

  async function saveFooter() {
    setFooterSaving(true);
    try {
      const payload = {
        footerColumns: footerCols.map(({ title, links }) => ({
          title,
          links: links.map(({ label, href }) => ({ label, href }))
        }))
      };
      const res = await fetch("/api/admin/global-setting", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) showToast("Footer kaydedildi ✓");
      else showToast("Hata oluştu", "error");
    } catch { showToast("Bağlantı hatası", "error"); }
    finally { setFooterSaving(false); }
  }

  // ── Styles ──────────────────────────────────────────────────
  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 10px", borderRadius: "8px", marginBottom: "6px",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    cursor: "grab", transition: "all 0.15s",
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px", padding: "6px 10px", color: "#e2e8f0", fontSize: "0.85rem", outline: "none",
  };

  return (
    <div>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* ── LEFT: Nav Links ─────────────────────── */}
        <div className="info-card">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><span className="ms">drag_handle</span> Header – Navigasyon Linkleri</span>
            <button className="btn btn-ghost btn-sm" onClick={addNavLink}>
              <span className="ms">add</span> Link Ekle
            </button>
          </div>

          <div style={{ marginTop: "12px" }}>
            {navLinks.map((link) => (
              <div
                key={link.id}
                style={rowStyle}
                draggable
                onDragStart={() => onNavDragStart(link.id)}
                onDragOver={(e) => onNavDragOver(e, link.id)}
                onDragEnd={() => setDragNav(null)}
              >
                <span className="ms" style={{ color: "#475569", fontSize: "18px", cursor: "grab", flexShrink: 0 }}>drag_indicator</span>
                <input
                  style={{ ...inputStyle, flex: 2 }}
                  value={link.label}
                  onChange={(e) => updateNavLink(link.id, "label", e.target.value)}
                  placeholder="Link adı"
                />
                <input
                  style={{ ...inputStyle, flex: 2 }}
                  value={link.href}
                  onChange={(e) => updateNavLink(link.id, "href", e.target.value)}
                  placeholder="/sayfa"
                />
                <button
                  onClick={() => removeNavLink(link.id)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px", borderRadius: "4px", flexShrink: 0 }}
                >
                  <span className="ms" style={{ fontSize: "18px" }}>close</span>
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setNavLinks(DEFAULT_NAV)}>
              <span className="ms">refresh</span> Sıfırla
            </button>
            <button className="btn btn-primary" onClick={saveNav} disabled={navSaving}>
              <span className="ms">save</span>
              {navSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>

          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "12px" }}>
            💡 <strong>Sürükle-bırak</strong> ile sırayı değiştir. Kaydet'e basınca tüm sayfalarda geçerli olur.
          </p>
        </div>

        {/* ── RIGHT: Footer Columns ──────────────── */}
        <div className="info-card">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><span className="ms">view_column</span> Footer – Bağlantı Sütunları</span>
            <button className="btn btn-ghost btn-sm" onClick={addFooterCol}>
              <span className="ms">add</span> Sütun Ekle
            </button>
          </div>

          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {footerCols.map((col) => (
              <div key={col.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden" }}>
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <input
                    value={col.title}
                    onChange={(e) => updateColTitle(col.id, e.target.value)}
                    style={{ ...inputStyle, fontWeight: 600, fontSize: "0.9rem" }}
                    placeholder="Sütun başlığı"
                  />
                  <button
                    onClick={() => removeFooterCol(col.id)}
                    style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", cursor: "pointer", padding: "6px", borderRadius: "6px" }}
                  >
                    <span className="ms" style={{ fontSize: "18px" }}>delete</span>
                  </button>
                </div>

                {/* Column links */}
                <div style={{ padding: "10px 12px" }}>
                  {col.links.map((link) => (
                    <div
                      key={link.id}
                      style={{ ...rowStyle, background: "none", border: "none", padding: "4px 0" }}
                      draggable
                      onDragStart={() => onLinkDragStart(col.id, link.id)}
                      onDragOver={(e) => onLinkDragOver(e, col.id, link.id)}
                      onDragEnd={() => setDragLink(null)}
                    >
                      <span className="ms" style={{ color: "#334155", fontSize: "16px", cursor: "grab", flexShrink: 0 }}>drag_indicator</span>
                      <input
                        style={{ ...inputStyle, flex: 2 }}
                        value={link.label}
                        onChange={(e) => updateFooterLink(col.id, link.id, "label", e.target.value)}
                        placeholder="Link adı"
                      />
                      <input
                        style={{ ...inputStyle, flex: 3 }}
                        value={link.href}
                        onChange={(e) => updateFooterLink(col.id, link.id, "href", e.target.value)}
                        placeholder="/sayfa veya https://..."
                      />
                      <button
                        onClick={() => removeFooterLink(col.id, link.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px", borderRadius: "4px", flexShrink: 0 }}
                      >
                        <span className="ms" style={{ fontSize: "16px" }}>close</span>
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => addFooterLink(col.id)}
                    style={{ marginTop: "6px", width: "100%", justifyContent: "center" }}
                  >
                    <span className="ms">add</span> Link Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setFooterCols(DEFAULT_FOOTER)}>
              <span className="ms">refresh</span> Sıfırla
            </button>
            <button className="btn btn-primary" onClick={saveFooter} disabled={footerSaving}>
              <span className="ms">save</span>
              {footerSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
