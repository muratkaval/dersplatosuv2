"use client";

import { useState } from "react";

interface Subj { id: number; documentId: string; name: string; }
type NetBucket = { min: number; max: number | null };

interface Props {
  initialVideo: string;
  initialExams: string[];
  initialNets: NetBucket[];
  initialSubjects: Subj[];
}

const DEFAULT_NETS: NetBucket[] = [
  { min: 0, max: 10 },
  { min: 10, max: 20 },
  { min: 20, max: 30 },
  { min: 30, max: 40 },
  { min: 40, max: null },
];

function bucketLabel(b: NetBucket) {
  return b.max == null || b.max <= b.min ? `${b.min}+ net` : `${b.min}-${b.max} net`;
}

const inputStyle: React.CSSProperties = { padding: "11px 14px", background: "#060d1a", border: "1.5px solid #1e3a5f", color: "#e2e8f0", borderRadius: "8px", outline: "none", fontSize: "0.9rem" };

export default function ProgramSettingsForm({ initialVideo, initialExams, initialNets, initialSubjects }: Props) {
  const [video, setVideo] = useState(initialVideo || "");
  const [exams, setExams] = useState<string[]>(Array.isArray(initialExams) ? initialExams : []);
  const [newExam, setNewExam] = useState("");
  const [nets, setNets] = useState<NetBucket[]>(Array.isArray(initialNets) && initialNets.length ? initialNets : DEFAULT_NETS);
  const [newMin, setNewMin] = useState("");
  const [newMax, setNewMax] = useState("");
  const [subjects, setSubjects] = useState<Subj[]>(initialSubjects);
  const [newSubject, setNewSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addExam() {
    const v = newExam.trim().toUpperCase();
    if (!v) return;
    if (exams.includes(v)) { showToast("Bu sınav zaten ekli", "error"); return; }
    setExams([...exams, v]);
    setNewExam("");
  }
  function removeExam(e: string) {
    setExams(exams.filter((x) => x !== e));
  }

  function addNet() {
    if (newMin === "") return;
    const min = Number(newMin);
    const max = newMax === "" ? null : Number(newMax);
    setNets([...nets, { min, max }].sort((a, b) => a.min - b.min));
    setNewMin(""); setNewMax("");
  }
  function removeNet(idx: number) {
    setNets(nets.filter((_, i) => i !== idx));
  }

  async function addSubject() {
    const name = newSubject.trim();
    if (!name) return;
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const r = await res.json();
      const it = r.data;
      setSubjects([{ id: it.id, documentId: it.documentId || String(it.id), name: it.name }, ...subjects]);
      setNewSubject("");
      showToast("Ders eklendi ✓");
    } else {
      showToast("Ders eklenemedi", "error");
    }
  }
  async function removeSubject(docId: string) {
    if (!confirm("Bu dersi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/subjects/${docId}`, { method: "DELETE" });
    if (res.ok) {
      setSubjects(subjects.filter((s) => s.documentId !== docId));
      showToast("Ders silindi ✓");
    } else {
      showToast("Silinemedi", "error");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/global-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programsPageVideo: video, programExams: exams, programNets: nets }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d?.error || "Kayıt hatası", "error");
        return;
      }
      showToast("Ayarlar kaydedildi ✓");
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  const chip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "50px", padding: "6px 8px 6px 14px", fontSize: "0.85rem", fontWeight: 600 };

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Üst video */}
          <div className="info-card">
            <div className="card-title"><span className="ms">smart_display</span> Üst Tanıtım Videosu</div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>YouTube linki / video ID</label>
              <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/..." />
              <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "4px" }}>/programlar sayfasının en üstünde gösterilir. Boş bırakılırsa video alanı görünmez.</p>
            </div>
          </div>

          {/* Sınavlar */}
          <div className="info-card">
            <div className="card-title"><span className="ms">school</span> Sınavlar</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              {exams.length === 0 ? (
                <span style={{ color: "#475569", fontSize: "0.85rem" }}>Henüz sınav yok. Aşağıdan ekleyin (örn. TYT, AYT, YDT).</span>
              ) : (
                exams.map((e) => (
                  <span key={e} style={chip}>
                    {e}
                    <button type="button" onClick={() => removeExam(e)} className="btn btn-ghost btn-icon" style={{ width: "22px", height: "22px", padding: 0, color: "#93c5fd" }}>
                      <span className="ms" style={{ fontSize: "15px" }}>close</span>
                    </button>
                  </span>
                ))
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={newExam} onChange={(e) => setNewExam(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExam())} placeholder="Örn: YDT" style={{ flex: 1, ...inputStyle }} />
              <button type="button" className="btn btn-ghost" onClick={addExam}><span className="ms">add</span> Ekle</button>
            </div>
            <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "8px" }}>Program eklerken bu listedeki sınavlardan seçilir. Değişiklik &quot;Kaydet&quot; ile kaydedilir.</p>
          </div>

          {/* Net Aralıkları */}
          <div className="info-card">
            <div className="card-title"><span className="ms">straighten</span> Net Aralıkları</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              {nets.length === 0 ? (
                <span style={{ color: "#475569", fontSize: "0.85rem" }}>Henüz net aralığı yok.</span>
              ) : (
                nets.map((b, i) => (
                  <span key={i} style={chip}>
                    {bucketLabel(b)}
                    <button type="button" onClick={() => removeNet(i)} className="btn btn-ghost btn-icon" style={{ width: "22px", height: "22px", padding: 0, color: "#93c5fd" }}>
                      <span className="ms" style={{ fontSize: "15px" }}>close</span>
                    </button>
                  </span>
                ))
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="number" value={newMin} onChange={(e) => setNewMin(e.target.value)} placeholder="Min" style={{ width: "80px", ...inputStyle }} />
              <span style={{ color: "#475569" }}>–</span>
              <input type="number" value={newMax} onChange={(e) => setNewMax(e.target.value)} placeholder="Max" style={{ width: "80px", ...inputStyle }} />
              <button type="button" className="btn btn-ghost" onClick={addNet}><span className="ms">add</span> Ekle</button>
            </div>
            <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "8px" }}>Filtredeki net butonları. Max boş bırakılırsa &quot;40+&quot; gibi açık uçlu olur. &quot;Kaydet&quot; ile kaydedilir.</p>
          </div>
        </div>

        {/* Dersler */}
        <div className="info-card">
          <div className="card-title"><span className="ms">category</span> Dersler / Branşlar</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())} placeholder="Yeni ders (örn: Geometri)" style={{ flex: 1, ...inputStyle }} />
            <button type="button" className="btn btn-primary" onClick={addSubject}><span className="ms">add</span> Ekle</button>
          </div>
          <div style={{ maxHeight: "360px", overflowY: "auto", border: "1.5px solid #1a2536", borderRadius: "12px", background: "#060d1a" }}>
            {subjects.length === 0 ? (
              <div className="empty-state">Ders yok.</div>
            ) : (
              subjects.map((s, idx) => (
                <div key={s.documentId} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: idx === subjects.length - 1 ? "none" : "1px solid #111d2e" }}>
                  <span style={{ flex: 1, color: "#cbd5e1", fontSize: "0.9rem", fontWeight: 500 }}>{s.name}</span>
                  <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeSubject(s.documentId)}><span className="ms">delete</span></button>
                </div>
              ))
            )}
          </div>
          <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "8px" }}>Dersler anında kaydedilir. (Kategoriler sayfasından da yönetilebilir.)</p>
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : "Video, Sınav & Net Kaydet"}
        </button>
      </div>
    </>
  );
}
