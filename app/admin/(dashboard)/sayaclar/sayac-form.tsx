"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Session {
  id?: string;
  name: string;
  date: string;
  time: string;
}

interface Props {
  countdown?: any;
}

function slugify(t: string) {
  return t.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Convert "YYYY-MM-DDTHH:mm:ss.000Z" to "YYYY-MM-DDTHH:mm" for datetime-local
function formatDateForInput(isoString: string) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SayacForm({ countdown }: Props) {
  const router = useRouter();
  const isEdit = !!countdown?.documentId;

  const [title, setTitle] = useState(countdown?.title || "");
  const [slug, setSlug] = useState(countdown?.slug || "");
  const [targetDate, setTargetDate] = useState(formatDateForInput(countdown?.targetDate) || "");
  const [description, setDescription] = useState(countdown?.description || "");
  const [bottomTitle, setBottomTitle] = useState(countdown?.bottomTitle || "");
  const [bottomText, setBottomText] = useState(countdown?.bottomText || "");
  const [enabled, setEnabled] = useState<boolean>(countdown?.enabled ?? true);
  const [showOnHomepage, setShowOnHomepage] = useState<boolean>(countdown?.showOnHomepage ?? false);
  const [metaTitle, setMetaTitle] = useState(countdown?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(countdown?.metaDescription || "");

  const editorRef = useRef<HTMLDivElement>(null);

  // Load initial HTML content into editor
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = countdown?.bottomText || "";
    }
  }, [countdown?.bottomText]);

  const [sessions, setSessions] = useState<Session[]>((countdown?.sessions || []).map((s: any, idx: number) => ({
    id: `s-${Date.now()}-${idx}`,
    name: s.sessionName || "",
    date: s.sessionDate || "",
    time: s.sessionTime || "",
  })));

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addSession() {
    setSessions([...sessions, { id: `s-${Date.now()}`, name: "", date: "", time: "" }]);
  }

  function updateSession(id: string, field: keyof Session, value: string) {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function removeSession(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id));
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

  async function handleSave() {
    if (!title.trim()) { showToast("Başlık zorunludur", "error"); return; }
    if (!targetDate) { showToast("Hedef tarih zorunludur", "error"); return; }

    const bottomTextHtml = editorRef.current?.innerHTML || "";

    setSaving(true);
    try {
      // Ensure date is in ISO format
      const targetIso = new Date(targetDate).toISOString();

      const payload = {
        title,
        slug: slug || slugify(title),
        targetDate: targetIso,
        description,
        bottomTitle,
        bottomText: bottomTextHtml,
        enabled,
        showOnHomepage,
        metaTitle,
        metaDescription,
        sessions: sessions.map(s => ({ sessionName: s.name, sessionDate: s.date, sessionTime: s.time })),
      };

      const url = isEdit ? `/api/admin/countdowns/${countdown.documentId}` : "/api/admin/countdowns";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || "Kayıt hatası", "error");
        return;
      }

      showToast(isEdit ? "Sayaç güncellendi ✓" : "Sayaç eklendi ✓");
      setTimeout(() => router.push("/admin/sayaclar"), 1000);
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Sol Kolon */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Temel Bilgiler */}
          <div className="info-card">
            <div className="card-title"><span className="ms">edit_note</span> Temel Bilgiler</div>

            <div className="form-group">
              <label>Başlık</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!isEdit) setSlug(slugify(e.target.value));
                }}
                placeholder="Örn: YKS 2026 Sayacı"
              />
            </div>

            <div className="form-group">
              <label>URL Slug</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "0.82rem", whiteSpace: "nowrap" }}>dersplatosu.com/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  style={{ flex: 1 }}
                  placeholder="yks-sayac"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Sınav Hedef Tarihi ve Saati</label>
              <input
                type="datetime-local"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Üst Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Örn: Hayallerine kavuşmana ne kadar kaldı? Aşağıdan süreyi takip et!"
                rows={3}
              />
            </div>
            
            <div style={{ display: "flex", gap: "16px", marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={enabled} 
                  onChange={(e) => setEnabled(e.target.checked)} 
                  style={{ width: "18px", height: "18px" }}
                />
                <span style={{ color: "#e2e8f0", fontWeight: 600 }}>Sayacı Aktif Et</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={showOnHomepage} 
                  onChange={(e) => setShowOnHomepage(e.target.checked)} 
                  style={{ width: "18px", height: "18px" }}
                />
                <span style={{ color: "#e2e8f0", fontWeight: 600 }}>Anasayfada Göster</span>
              </label>
            </div>
          </div>

          {/* Oturumlar */}
          <div className="info-card">
            <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><span className="ms">list_alt</span> Sınav Oturumları</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addSession} style={{ padding: "4px 8px" }}>
                <span className="ms">add</span> Ekle
              </button>
            </div>
            
            {sessions.length === 0 ? (
              <div className="empty-state">Oturum eklenmemiş.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sessions.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", gap: "12px", background: "#0b1628", padding: "16px", borderRadius: "8px", border: "1px solid #1e3a5f", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "12px" }}>
                      <input 
                        value={s.name} 
                        onChange={(e) => updateSession(s.id as string, "name", e.target.value)} 
                        placeholder="Oturum Adı (Örn: TYT)" 
                        style={{ padding: "10px", background: "#060d1a", border: "1px solid #1e3a5f", color: "#e2e8f0", borderRadius: "6px", outline: "none", width: "100%" }}
                      />
                      <div style={{ display: "flex", gap: "12px" }}>
                        <input 
                          value={s.date} 
                          onChange={(e) => updateSession(s.id as string, "date", e.target.value)} 
                          placeholder="Tarih (Örn: 20 Haziran Cumartesi)" 
                          style={{ padding: "10px", background: "#060d1a", border: "1px solid #1e3a5f", color: "#e2e8f0", borderRadius: "6px", outline: "none", flex: 1 }}
                        />
                        <input 
                          value={s.time} 
                          onChange={(e) => updateSession(s.id as string, "time", e.target.value)} 
                          placeholder="Saat (Örn: 10:15)" 
                          style={{ padding: "10px", background: "#060d1a", border: "1px solid #1e3a5f", color: "#e2e8f0", borderRadius: "6px", outline: "none", width: "140px" }}
                        />
                      </div>
                    </div>
                    <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeSession(s.id as string)}>
                      <span className="ms">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sağ Kolon */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="info-card">
            <div className="card-title"><span className="ms">public</span> SEO Ayarları</div>
            <div className="form-group">
              <label>SEO Başlığı (Meta Title)</label>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Boş bırakılırsa normal başlık kullanılır"
              />
            </div>
            <div className="form-group">
              <label>SEO Açıklaması (Meta Description)</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                placeholder="Boş bırakılırsa normal açıklama kullanılır"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Alt Bölüm Metinleri - Tam Genişlik (En Altta) */}
      <div className="info-card" style={{ marginTop: "20px" }}>
        <div className="card-title"><span className="ms">segment</span> Alt Bölüm Metinleri</div>
        <div className="form-group">
          <label>Alt Başlık</label>
          <input
            value={bottomTitle}
            onChange={(e) => setBottomTitle(e.target.value)}
            placeholder="Örn: Heyecan Yapma, Biz Buradayız"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Alt Metin</label>
          <div style={{
            border: "1px solid #1e3a5f", borderRadius: "8px", overflow: "hidden", background: "#0b1628", marginTop: "4px"
          }}>
            {/* Toolbar */}
            <div style={{
              display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px",
              padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)"
            }}>
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
                <option value="h3">Başlık 3</option>
                <option value="h4">Başlık 4</option>
              </select>

              <Sep />

              <TB title="Kalın" onClick={() => exec("bold")}><strong style={{ fontFamily: "serif", fontSize: "14px" }}>B</strong></TB>
              <TB title="İtalik" onClick={() => exec("italic")}><em style={{ fontFamily: "serif", fontSize: "14px" }}>I</em></TB>
              <TB title="Altı Çizili" onClick={() => exec("underline")}><span style={{ textDecoration: "underline", fontSize: "13px" }}>U</span></TB>

              <Sep />

              <TB title="Madde işaretli liste" onClick={() => exec("insertUnorderedList")}><span className="ms" style={{ fontSize: "16px" }}>format_list_bulleted</span></TB>
              <TB title="Numaralı liste" onClick={() => exec("insertOrderedList")}><span className="ms" style={{ fontSize: "16px" }}>format_list_numbered</span></TB>

              <Sep />
              
              <TB title="Sola Hizala" onClick={() => exec("justifyLeft")}><span className="ms" style={{ fontSize: "16px" }}>format_align_left</span></TB>
              <TB title="Ortala" onClick={() => exec("justifyCenter")}><span className="ms" style={{ fontSize: "16px" }}>format_align_center</span></TB>

              <Sep />

              <TB title="Link ekle" onClick={insertLink}><span className="ms" style={{ fontSize: "16px" }}>link</span></TB>
              <TB title="Biçimlendirmeyi temizle" onClick={() => exec("removeFormat")}><span className="ms" style={{ fontSize: "16px" }}>format_clear</span></TB>
            </div>
            
            {/* Editor Area */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Örn: Ders Platosu ile eksiklerini kapat..."
              style={{
                minHeight: "150px",
                padding: "16px",
                color: "#e2e8f0",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                outline: "none"
              }}
            />
          </div>
        </div>
      </div>



      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/admin/sayaclar")}>◀ İptal</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
        </button>
      </div>

      {/* Editor styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #475569;
          pointer-events: none;
        }
        [contenteditable] h3 { font-size: 1.1rem; font-weight: 600; margin: 12px 0 8px; color: #cbd5e1; }
        [contenteditable] h4 { font-size: 1rem; font-weight: 600; margin: 10px 0 6px; color: #94a3b8; }
        [contenteditable] p  { margin: 0 0 10px; }
        [contenteditable] strong { color: #f8fafc; }
        [contenteditable] em { color: #c4b5fd; }
        [contenteditable] a  { color: #818cf8; text-decoration: underline; }
        [contenteditable] ul { padding-left: 24px; margin: 6px 0 10px; list-style: disc; }
        [contenteditable] ol { padding-left: 24px; margin: 6px 0 10px; list-style: decimal; }
        [contenteditable] li { margin: 2px 0; }
      `}</style>
    </>
  );
}
