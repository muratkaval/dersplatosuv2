"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toMediaUrl } from "@/app/lib/strapi";

interface WeekItem {
  id: string;
  weekNo: number;
  title: string;
  imageFile: File | null;
  imageUrl: string;
  imageId: number | null;
  pdfFile: File | null;
  pdfName: string;
  pdfId: number | null;
  link: string;
  contentType: "image" | "pdf" | "link";
}

interface Props {
  program?: any;
  subjects: any[];
  exams?: string[];
  nets?: { min: number; max: number | null }[];
  books?: any[];
}

function slugify(t: string) {
  return t.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

async function uploadFile(file: File): Promise<number | null> {
  const fd = new FormData();
  fd.append("files", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (res.ok && data?.[0]) return data[0].id;
  return null;
}

const DEFAULT_NETS: { min: number; max: number | null }[] = [
  { min: 0, max: 10 },
  { min: 10, max: 20 },
  { min: 20, max: 30 },
  { min: 30, max: 40 },
  { min: 40, max: null },
];

function netRangeLabel(min: string, max: string) {
  if (min === "" && max === "") return "";
  return max === "" ? `${min}+ net` : `${min}-${max} net`;
}

function unitWordOf(p: string) {
  return p === "Günlük" ? "Gün" : p === "Aylık" ? "Ay" : "Hafta";
}

export default function ProgramForm({ program, subjects, exams, nets, books = [] }: Props) {
  const router = useRouter();
  const isEdit = !!program?.documentId;
  const examOptions = Array.from(new Set([...(exams || []), ...(program?.examType ? [program.examType] : [])]));
  const netOptions = nets && nets.length ? nets : DEFAULT_NETS;

  const [title, setTitle] = useState(program?.title || "");
  const [slug, setSlug] = useState(program?.slug || "");
  const [examType, setExamType] = useState(program?.examType || examOptions[0] || "");
  const [periodType, setPeriodType] = useState(program?.periodType || "Haftalık");
  const [netMin, setNetMin] = useState<string>(program?.netMin?.toString() ?? "");
  const [netMax, setNetMax] = useState<string>(program?.netMax?.toString() ?? "");
  const [description, setDescription] = useState(program?.description || "");
  const [videoUrl, setVideoUrl] = useState(program?.videoUrl || "");
  const [displayOrder, setDisplayOrder] = useState<string>(program?.displayOrder?.toString() ?? "");
  const [selSubjects, setSelSubjects] = useState<string[]>(
    (program?.subjects || []).map((s: any) => s.documentId || String(s.id))
  );
  const [selBooks, setSelBooks] = useState<string[]>(
    (program?.books || []).map((b: any) => b.documentId || String(b.id))
  );

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(toMediaUrl(program?.cover?.url));
  const coverId = program?.cover?.id ?? null;

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>(program?.downloadPdf?.name || "");
  const pdfId = program?.downloadPdf?.id ?? null;

  const [weeks, setWeeks] = useState<WeekItem[]>(
    (program?.weeks || []).map((w: any, idx: number) => ({
      id: `w-${Date.now()}-${idx}`,
      weekNo: w.weekNo ?? idx + 1,
      title: w.title || "",
      imageFile: null,
      imageUrl: toMediaUrl(w.scheduleImage?.url),
      imageId: w.scheduleImage?.id ?? null,
      pdfFile: null,
      pdfName: w.pdf?.name || "",
      pdfId: w.pdf?.id ?? null,
      link: w.link || "",
      contentType: (w.scheduleImage?.url ? "image" : w.pdf?.url ? "pdf" : w.link ? "link" : "image") as "image" | "pdf" | "link",
    }))
  );

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function toggleSubject(id: string) {
    setSelSubjects((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleBook(id: string) {
    setSelBooks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addWeek() {
    const nextNo = weeks.length > 0 ? Math.max(...weeks.map((w) => w.weekNo)) + 1 : 1;
    setWeeks([...weeks, { id: `w-${Date.now()}`, weekNo: nextNo, title: `${nextNo}. ${unitWordOf(periodType)}`, imageFile: null, imageUrl: "", imageId: null, pdfFile: null, pdfName: "", pdfId: null, link: "", contentType: "image" }]);
  }

  function updateWeek(id: string, field: keyof WeekItem, value: any) {
    setWeeks((prev) => prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  }

  function removeWeek(id: string) {
    setWeeks((prev) => prev.filter((w) => w.id !== id));
  }

  function onWeekImage(id: string, file: File) {
    updateWeek(id, "imageFile", file);
    updateWeek(id, "imageUrl", URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!title.trim()) { showToast("Başlık zorunludur", "error"); return; }
    if (!examType) { showToast("Sınav türü zorunludur", "error"); return; }

    setSaving(true);
    try {
      // cover
      let finalCoverId = coverId;
      if (coverFile) {
        const up = await uploadFile(coverFile);
        if (up) finalCoverId = up; else { showToast("Kapak yüklenemedi", "error"); setSaving(false); return; }
      }
      // pdf
      let finalPdfId = pdfId;
      if (pdfFile) {
        const up = await uploadFile(pdfFile);
        if (up) finalPdfId = up; else { showToast("PDF yüklenemedi", "error"); setSaving(false); return; }
      }
      // week images
      const weeksPayload: any[] = [];
      for (const w of weeks) {
        const wp: any = { weekNo: Number(w.weekNo) || 0, title: w.title, scheduleImage: null, pdf: null, link: null };
        if (w.contentType === "image") {
          let imgId = w.imageId;
          if (w.imageFile) {
            const up = await uploadFile(w.imageFile);
            if (up) imgId = up; else { showToast(`${w.weekNo}. birim görseli yüklenemedi`, "error"); setSaving(false); return; }
          }
          wp.scheduleImage = imgId || null;
        } else if (w.contentType === "pdf") {
          let wPdfId = w.pdfId;
          if (w.pdfFile) {
            const up = await uploadFile(w.pdfFile);
            if (up) wPdfId = up; else { showToast(`${w.weekNo}. birim PDF yüklenemedi`, "error"); setSaving(false); return; }
          }
          wp.pdf = wPdfId || null;
        } else {
          wp.link = w.link || null;
        }
        weeksPayload.push(wp);
      }

      const payload: any = {
        title,
        slug: slug || slugify(title),
        examType,
        periodType,
        netMin: netMin === "" ? null : Number(netMin),
        netMax: netMax === "" ? null : Number(netMax),
        description,
        videoUrl,
        subjects: selSubjects,
        books: selBooks,
        weeks: weeksPayload,
        displayOrder: displayOrder === "" ? 99 : Number(displayOrder),
        ...(finalCoverId ? { cover: finalCoverId } : {}),
        ...(finalPdfId ? { downloadPdf: finalPdfId } : {}),
      };

      const url = isEdit ? `/api/admin/programs/${program.documentId}` : "/api/admin/programs";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data?.error || "Kayıt hatası", "error"); return; }

      showToast(isEdit ? "Program güncellendi ✓" : "Program eklendi ✓");
      setTimeout(() => router.push("/admin/programlar"), 1000);
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle: React.CSSProperties = { padding: "10px", background: "#060d1a", border: "1px solid #1e3a5f", color: "#e2e8f0", borderRadius: "6px", outline: "none", width: "100%" };

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Sol */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="info-card">
            <div className="card-title"><span className="ms">edit_note</span> Temel Bilgiler</div>

            <div className="form-group">
              <label>Başlık</label>
              <input value={title} onChange={(e) => { setTitle(e.target.value); if (!isEdit) setSlug(slugify(e.target.value)); }} placeholder="Örn: TYT Matematik Bitirme Kampı" />
            </div>

            <div className="form-group">
              <label>URL Slug</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#64748b", fontSize: "0.82rem", whiteSpace: "nowrap" }}>dersplatosu.com/programlar/</span>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} style={{ flex: 1 }} placeholder="tyt-matematik-bitirme" />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Sınav</label>
                {examOptions.length > 0 ? (
                  <select value={examType} onChange={(e) => setExamType(e.target.value)} style={fieldStyle}>
                    {examOptions.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                ) : (
                  <a href="/admin/programlar/ayarlar" style={{ display: "block", padding: "10px", borderRadius: "6px", border: "1px dashed #1e3a5f", color: "#60a5fa", fontSize: "0.82rem", textDecoration: "none" }}>
                    Önce Ayarlar&apos;dan sınav ekleyin →
                  </a>
                )}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Net Aralığı</label>
                <select
                  value={`${netMin}|${netMax}`}
                  onChange={(e) => { const parts = e.target.value.split("|"); setNetMin(parts[0] ?? ""); setNetMax(parts[1] ?? ""); }}
                  style={fieldStyle}
                >
                  <option value="|">Seçiniz</option>
                  {netOptions.map((b, i) => (
                    <option key={i} value={`${b.min}|${b.max ?? ""}`}>{b.max == null ? `${b.min}+ net` : `${b.min}-${b.max} net`}</option>
                  ))}
                  {(netMin !== "" || netMax !== "") && !netOptions.some((b) => `${b.min}|${b.max ?? ""}` === `${netMin}|${netMax}`) && (
                    <option value={`${netMin}|${netMax}`}>{netRangeLabel(netMin, netMax)} (özel)</option>
                  )}
                </select>
              </div>
            </div>
            <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "-8px" }}>Sınav ve net aralığı, Ayarlar&apos;dan yönetilen listeden seçilir.</p>

            <div className="form-group">
              <label>Açıklama</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Programın kısa açıklaması" />
            </div>

            <div className="form-group">
              <label>YouTube Video (opsiyonel)</label>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtu.be/... — Haftalık Program üstünde gösterilir" />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div className="form-group" style={{ width: "110px", marginBottom: 0 }}>
                <label>Sıralama</label>
                <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} placeholder="99" />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>İçerik Türü</label>
                <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} style={fieldStyle}>
                  <option value="Haftalık">Haftalık</option>
                  <option value="Günlük">Günlük</option>
                  <option value="Aylık">Aylık</option>
                </select>
              </div>
            </div>
          </div>

          {/* Branş */}
          <div className="info-card">
            <div className="card-title"><span className="ms">category</span> Branş (boş = Genel)</div>
            <div style={{ maxHeight: "220px", overflowY: "auto", border: "1.5px solid #1a2536", borderRadius: "12px", background: "#060d1a" }}>
              {subjects.length === 0 ? (
                <div className="empty-state">Ders bulunamadı.</div>
              ) : (
                subjects.map((c, idx) => {
                  const id = c.documentId || String(c.id);
                  const selected = selSubjects.includes(id);
                  const isLast = idx === subjects.length - 1;
                  return (
                    <button key={id} type="button" onClick={() => toggleSubject(id)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "11px 16px", background: selected ? "rgba(167,139,250,0.12)" : "transparent", color: selected ? "#a78bfa" : "#94a3b8", border: "none", borderBottom: isLast ? "none" : "1px solid #111d2e", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: selected ? 600 : 400, textAlign: "left" }}>
                      <span style={{ width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, border: selected ? "2px solid #a78bfa" : "2px solid #243249", background: selected ? "#a78bfa" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {selected && <span className="ms" style={{ fontSize: "14px", color: "#060d1a", fontWeight: "bold" }}>check</span>}
                      </span>
                      <span style={{ flex: 1 }}>{c.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Kitaplar (bu programda kullanilacak) */}
          <div className="info-card">
            <div className="card-title"><span className="ms">menu_book</span> Kitaplar (bu programda kullanılacak)</div>
            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1.5px solid #1a2536", borderRadius: "12px", background: "#060d1a" }}>
              {books.length === 0 ? (
                <div className="empty-state">Kitap bulunamadı.</div>
              ) : (
                books.map((b, idx) => {
                  const id = b.documentId || String(b.id);
                  const selected = selBooks.includes(id);
                  const isLast = idx === books.length - 1;
                  const cov = toMediaUrl(b.cover?.url);
                  return (
                    <button key={id} type="button" onClick={() => toggleBook(id)}
                      style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "9px 14px", background: selected ? "rgba(251,191,36,0.10)" : "transparent", color: selected ? "#fbbf24" : "#94a3b8", border: "none", borderBottom: isLast ? "none" : "1px solid #111d2e", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: selected ? 600 : 400, textAlign: "left" }}>
                      <span style={{ width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, border: selected ? "2px solid #fbbf24" : "2px solid #243249", background: selected ? "#fbbf24" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {selected && <span className="ms" style={{ fontSize: "14px", color: "#060d1a", fontWeight: "bold" }}>check</span>}
                      </span>
                      {cov ? (
                        <img src={cov} alt="" style={{ width: "30px", height: "40px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                      ) : (
                        <span className="ms" style={{ fontSize: "20px", opacity: 0.3, width: "30px", textAlign: "center", flexShrink: 0 }}>menu_book</span>
                      )}
                      <span style={{ flex: 1 }}>{b.title}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sağ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Medya */}
          <div className="info-card">
            <div className="card-title"><span className="ms">collections</span> Medya</div>

            <div className="form-group">
              <label>Kapak Görseli</label>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "80px", height: "50px", background: "#0f172a", border: "1.5px dashed #1e3a5f", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {coverPreview ? <img src={coverPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span className="ms" style={{ fontSize: "1.2rem", opacity: 0.2 }}>image</span>}
                </div>
                <label className="btn btn-ghost btn-sm" style={{ flex: 1, borderStyle: "solid", borderColor: "#1e3a5f", cursor: "pointer" }}>
                  <span className="ms">add_a_photo</span> {coverPreview ? "Değiştir" : "Görsel Seç"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} />
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>İndirilecek PDF</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ flex: 1, color: pdfName ? "#e2e8f0" : "#475569", fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span className="ms" style={{ fontSize: "16px", verticalAlign: "-3px", marginRight: "4px" }}>picture_as_pdf</span>
                  {pdfName || "PDF seçilmedi"}
                </span>
                <label className="btn btn-ghost btn-sm" style={{ borderStyle: "solid", borderColor: "#1e3a5f", cursor: "pointer", flexShrink: 0 }}>
                  <span className="ms">upload_file</span> {pdfName ? "Değiştir" : "PDF Seç"}
                  <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPdfFile(f); setPdfName(f.name); } }} />
                </label>
              </div>
            </div>
          </div>

          {/* Haftalar */}
          <div className="info-card">
            <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><span className="ms">view_week</span> {periodType} Programlar ({weeks.length})</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addWeek} style={{ padding: "4px 8px" }}><span className="ms">add</span> {unitWordOf(periodType)} Ekle</button>
            </div>

            {weeks.length === 0 ? (
              <div className="empty-state">İçerik eklenmemiş.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {weeks.map((w) => (
                  <div key={w.id} style={{ background: "#0b1628", padding: "14px", borderRadius: "8px", border: "1px solid #1e3a5f", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <input type="number" value={w.weekNo} onChange={(e) => updateWeek(w.id, "weekNo", Number(e.target.value))} style={{ ...fieldStyle, width: "70px" }} title="Hafta no" />
                      <input value={w.title} onChange={(e) => updateWeek(w.id, "title", e.target.value)} placeholder="Başlık (Örn: 1. Hafta)" style={{ ...fieldStyle, flex: 1 }} />
                      <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeWeek(w.id)}><span className="ms">delete</span></button>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {(["image", "pdf", "link"] as const).map((t) => (
                        <button key={t} type="button" onClick={() => updateWeek(w.id, "contentType", t)}
                          className={`btn btn-sm ${w.contentType === t ? "btn-primary" : "btn-ghost"}`}
                          style={{ borderStyle: "solid", borderColor: "#1e3a5f", flex: 1 }}>
                          <span className="ms">{t === "image" ? "image" : t === "pdf" ? "picture_as_pdf" : "link"}</span>
                          {t === "image" ? "Görsel" : t === "pdf" ? "PDF" : "Link"}
                        </button>
                      ))}
                    </div>

                    {w.contentType === "image" && (
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ width: "64px", height: "48px", background: "#0f172a", border: "1.5px dashed #1e3a5f", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {w.imageUrl ? <img src={w.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span className="ms" style={{ fontSize: "1rem", opacity: 0.2 }}>image</span>}
                        </div>
                        <label className="btn btn-ghost btn-sm" style={{ borderStyle: "solid", borderColor: "#1e3a5f", cursor: "pointer" }}>
                          <span className="ms">add_photo_alternate</span> {w.imageUrl ? "Görseli Değiştir" : "Görsel Seç"}
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onWeekImage(w.id, f); }} />
                        </label>
                      </div>
                    )}

                    {w.contentType === "pdf" && (
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <label className="btn btn-ghost btn-sm" style={{ borderStyle: "solid", borderColor: "#1e3a5f", cursor: "pointer" }}>
                          <span className="ms">picture_as_pdf</span> {w.pdfName ? "PDF Değiştir" : "PDF Seç"}
                          <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { updateWeek(w.id, "pdfFile", f); updateWeek(w.id, "pdfName", f.name); } }} />
                        </label>
                        <span style={{ fontSize: "0.78rem", color: w.pdfName ? "#94a3b8" : "#475569" }}>{w.pdfName || "PDF seçilmedi"}</span>
                      </div>
                    )}

                    {w.contentType === "link" && (
                      <input value={w.link} onChange={(e) => updateWeek(w.id, "link", e.target.value)} placeholder="https://..." style={{ ...fieldStyle }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/admin/programlar")}>◀ İptal</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
        </button>
      </div>
    </>
  );
}
