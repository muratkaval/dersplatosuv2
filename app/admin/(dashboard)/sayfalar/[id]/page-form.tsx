"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialData: any;
  pageId: string | null;
  token: string;
}

export function PageForm({ initialData, pageId, token }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load initial HTML content into editor
  useEffect(() => {
    if (editorRef.current) {
      const raw = initialData?.attributes?.content ?? initialData?.content ?? "";
      editorRef.current.innerHTML = raw;
    }
  }, []);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    setSlug(slugify(val));
  }

  // ── execCommand helpers ──────────────────────────────────────
  function exec(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  }

  function formatBlock(tag: string) {
    exec("formatBlock", tag);
  }

  function insertLink() {
    const url = window.prompt("Link URL'si:", "https://");
    if (url) exec("createLink", url);
  }

  function insertImage() {
    const url = window.prompt("Resim URL'si:", "https://");
    if (url) exec("insertImage", url);
  }

  // ── Save / Delete ────────────────────────────────────────────
  async function handleSave() {
    if (!title.trim()) { showToast("Başlık boş olamaz", "error"); return; }
    const content = editorRef.current?.innerHTML || "";
    setSaving(true);
    try {
      const url = pageId ? `/api/admin/pages/${pageId}` : `/api/admin/pages`;
      const res = await fetch(url, {
        method: pageId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, content }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Sayfa başarıyla kaydedildi ✓");
        if (!pageId && data?.data?.documentId) router.push(`/admin/sayfalar/${data.data.documentId}`);
      } else {
        showToast("Hata: " + (data?.error || "Bilinmeyen hata"), "error");
      }
    } catch { showToast("Bağlantı hatası", "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!pageId) return;
    if (!confirm(`"${title}" sayfasını silmek istediğinize emin misiniz?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`, { method: "DELETE" });
      if (res.ok) router.push("/admin/sayfalar");
      else showToast("Silme işlemi başarısız", "error");
    } catch { showToast("Bağlantı hatası", "error"); }
    finally { setDeleting(false); }
  }

  // ── Toolbar button ──────────────────────────────────────────
  function TB({ children, title: ttl, onClick, style: s }: {
    children: React.ReactNode; title: string; onClick: () => void; style?: React.CSSProperties;
  }) {
    return (
      <button
        type="button"
        title={ttl}
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        style={{
          background: "none", border: "none", color: "#94a3b8",
          cursor: "pointer", padding: "5px 9px", borderRadius: "5px",
          fontSize: "0.8rem", display: "inline-flex", alignItems: "center",
          gap: "4px", transition: "all 0.12s", ...s,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(167,139,250,0.12)";
          (e.currentTarget as HTMLButtonElement).style.color = "#c4b5fd";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "none";
          (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
        }}
      >
        {children}
      </button>
    );
  }

  const Sep = () => <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 6px", flexShrink: 0 }} />;

  return (
    <div className="seo-form-container">
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        {pageId ? (
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            <span className="ms">delete</span>
            {deleting ? "Siliniyor..." : "Sayfayı Sil"}
          </button>
        ) : <div />}
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : "Kaydet & Yayınla"}
        </button>
      </div>

      {/* Page meta */}
      <div className="info-card">
        <div className="card-title"><span className="ms">edit_document</span> Sayfa Bilgileri</div>
        <div className="form-group">
          <label>SAYFA BAŞLIĞI</label>
          <input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Örn: Kullanım Koşulları" />
        </div>
        <div className="form-group">
          <label>SLUG (URL YOLU)</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>dersplatosu.com/</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="kullanim-kosullari" style={{ flex: 1 }} />
          </div>
        </div>
      </div>

      {/* WYSIWYG Editor */}
      <div className="info-card" style={{ marginTop: "20px", padding: 0, overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px",
          padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)"
        }}>
          {/* Heading select */}
          <select
            onChange={(e) => { formatBlock(e.target.value); e.target.value = "p"; editorRef.current?.focus(); }}
            defaultValue="p"
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8", borderRadius: "6px", padding: "4px 8px",
              fontSize: "0.78rem", cursor: "pointer", outline: "none",
            }}
          >
            <option value="p">Normal</option>
            <option value="h1">Başlık 1</option>
            <option value="h2">Başlık 2</option>
            <option value="h3">Başlık 3</option>
            <option value="h4">Başlık 4</option>
            <option value="pre">Kod Bloğu</option>
          </select>

          <Sep />

          <TB title="Kalın (Ctrl+B)" onClick={() => exec("bold")}>
            <strong style={{ fontFamily: "serif", fontSize: "14px" }}>B</strong>
          </TB>
          <TB title="İtalik (Ctrl+I)" onClick={() => exec("italic")}>
            <em style={{ fontFamily: "serif", fontSize: "14px" }}>I</em>
          </TB>
          <TB title="Altı Çizili (Ctrl+U)" onClick={() => exec("underline")}>
            <span style={{ textDecoration: "underline", fontSize: "13px" }}>U</span>
          </TB>
          <TB title="Üstü Çizili" onClick={() => exec("strikeThrough")}>
            <span style={{ textDecoration: "line-through", fontSize: "13px" }}>S</span>
          </TB>

          <Sep />

          <TB title="Sola Hizala" onClick={() => exec("justifyLeft")}>
            <span className="ms" style={{ fontSize: "18px" }}>format_align_left</span>
          </TB>
          <TB title="Ortala" onClick={() => exec("justifyCenter")}>
            <span className="ms" style={{ fontSize: "18px" }}>format_align_center</span>
          </TB>
          <TB title="Sağa Hizala" onClick={() => exec("justifyRight")}>
            <span className="ms" style={{ fontSize: "18px" }}>format_align_right</span>
          </TB>

          <Sep />

          <TB title="Madde işaretli liste" onClick={() => exec("insertUnorderedList")}>
            <span className="ms" style={{ fontSize: "18px" }}>format_list_bulleted</span>
          </TB>
          <TB title="Numaralı liste" onClick={() => exec("insertOrderedList")}>
            <span className="ms" style={{ fontSize: "18px" }}>format_list_numbered</span>
          </TB>
          <TB title="Girintiyi artır" onClick={() => exec("indent")}>
            <span className="ms" style={{ fontSize: "18px" }}>format_indent_increase</span>
          </TB>
          <TB title="Girintiyi azalt" onClick={() => exec("outdent")}>
            <span className="ms" style={{ fontSize: "18px" }}>format_indent_decrease</span>
          </TB>

          <Sep />

          <TB title="Link ekle" onClick={insertLink}>
            <span className="ms" style={{ fontSize: "18px" }}>link</span>
          </TB>
          <TB title="Link kaldır" onClick={() => exec("unlink")}>
            <span className="ms" style={{ fontSize: "18px" }}>link_off</span>
          </TB>
          <TB title="Resim ekle" onClick={insertImage}>
            <span className="ms" style={{ fontSize: "18px" }}>image</span>
          </TB>
          <TB title="Yatay çizgi" onClick={() => exec("insertHorizontalRule")}>
            <span className="ms" style={{ fontSize: "18px" }}>horizontal_rule</span>
          </TB>

          <Sep />

          <TB title="Geri Al (Ctrl+Z)" onClick={() => exec("undo")}>
            <span className="ms" style={{ fontSize: "18px" }}>undo</span>
          </TB>
          <TB title="İleri Al (Ctrl+Y)" onClick={() => exec("redo")}>
            <span className="ms" style={{ fontSize: "18px" }}>redo</span>
          </TB>
          <TB title="Biçimlendirmeyi temizle" onClick={() => exec("removeFormat")}>
            <span className="ms" style={{ fontSize: "18px" }}>format_clear</span>
          </TB>
        </div>

        {/* Editable content area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Buraya içerik yazın..."
          style={{
            minHeight: "500px",
            padding: "28px 32px",
            color: "#e2e8f0",
            fontSize: "1rem",
            lineHeight: "1.85",
            outline: "none",
            background: "rgba(255,255,255,0.02)",
          }}
        />

        {/* Status bar */}
        <div style={{
          padding: "8px 20px", borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: "16px", fontSize: "0.72rem", color: "#64748b",
          background: "rgba(0,0,0,0.1)"
        }}>
          <span>🖊️ WYSIWYG Editör</span>
          {pageId && <span>📎 /{slug}</span>}
        </div>
      </div>

      {/* Editor styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #475569;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 2rem; font-weight: 700; margin: 24px 0 12px; color: #f1f5f9; }
        [contenteditable] h2 { font-size: 1.5rem; font-weight: 600; margin: 20px 0 10px; color: #e2e8f0; }
        [contenteditable] h3 { font-size: 1.2rem; font-weight: 600; margin: 16px 0 8px; color: #cbd5e1; }
        [contenteditable] h4 { font-size: 1rem; font-weight: 600; margin: 14px 0 6px; color: #94a3b8; }
        [contenteditable] p  { margin: 0 0 12px; }
        [contenteditable] strong { color: #f8fafc; }
        [contenteditable] em { color: #c4b5fd; }
        [contenteditable] a  { color: #818cf8; text-decoration: underline; }
        [contenteditable] ul { padding-left: 24px; margin: 8px 0 12px; list-style: disc; }
        [contenteditable] ol { padding-left: 24px; margin: 8px 0 12px; list-style: decimal; }
        [contenteditable] li { margin: 4px 0; }
        [contenteditable] pre { background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; overflow-x: auto; margin: 12px 0; }
        [contenteditable] hr { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 24px 0; }
        [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
        [contenteditable] blockquote { border-left: 3px solid #818cf8; padding-left: 16px; color: #94a3b8; margin: 12px 0; font-style: italic; }
      `}</style>
    </div>
  );
}

export default PageForm;
