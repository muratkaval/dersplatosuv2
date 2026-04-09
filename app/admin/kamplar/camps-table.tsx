"use client";

import { useState } from "react";
import Link from "next/link";

interface Camp {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  categories?: { name: string }[];
  instructors?: { name: string }[];
}

interface Props {
  initialCamps: Camp[];
}

export default function CampsTable({ initialCamps }: Props) {
  const [camps, setCamps] = useState(initialCamps);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function onDragStart(i: number) {
    setDragIdx(i);
  }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const newCamps = [...camps];
    const moved = newCamps.splice(dragIdx, 1)[0];
    newCamps.splice(i, 0, moved);
    setCamps(newCamps);
    setDragIdx(i);
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const ids = camps.map((c) => c.documentId);
      const res = await fetch("/api/admin/camp-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) showToast("Sıralama kaydedildi ✓");
      else showToast("Kaydedilemedi", "error");
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deletecamp(docId: string) {
    if (!confirm("Bu kampı silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/camps/${docId}`, { method: "DELETE" });
    if (res.ok) {
      setCamps((prev) => prev.filter((c) => c.documentId !== docId));
      showToast("Kamp silindi ✓");
    } else {
      showToast("Silinemedi", "error");
    }
  }

  return (
    <>
      {toast && (
        <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h3>{camps.length} Kamp</h3>
          <small style={{ color: "#475569", fontSize: "0.75rem" }}>
            ⠿ sürükle → sıra değişir
          </small>
        </div>

        {camps.length === 0 ? (
          <div className="empty-state">
            <span className="ms">camping</span>
            Henüz kamp yok
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: "32px" }}></th>
                <th>Başlık / Slug</th>
                <th>Eğitimci</th>
                <th>Kategori</th>
                <th style={{ textAlign: "center" }}>Sıra</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {camps.map((camp, i) => (
                <tr
                  key={camp.documentId}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDragEnd={() => setDragIdx(null)}
                  style={{ opacity: dragIdx === i ? 0.5 : 1, cursor: "grab" }}
                >
                  <td>
                    <span className="drag-handle">⠿</span>
                  </td>
                  <td>
                    <strong style={{ color: "#e2e8f0" }}>{camp.title || "—"}</strong>
                    <br />
                    <small style={{ color: "#475569" }}>{camp.slug}</small>
                  </td>
                  <td style={{ color: "#94a3b8" }}>
                    {(camp.instructors || []).map((i) => i.name).join(", ") || "—"}
                  </td>
                  <td>
                    {(camp.categories || []).map((c, ci) => (
                      <span key={ci} className="badge badge-blue" style={{ marginRight: "4px" }}>{c.name}</span>
                    ))}
                    {!(camp.categories?.length) && "—"}
                  </td>
                  <td style={{ textAlign: "center", color: "#475569" }}>{i + 1}</td>
                  <td>
                    <div className="td-actions">
                      <Link href={`/admin/kamplar/${camp.documentId}`} className="btn btn-ghost btn-sm btn-icon">
                        <span className="ms">edit</span>
                      </Link>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => deletecamp(camp.documentId)}
                      >
                        <span className="ms">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-success" onClick={saveOrder} disabled={saving}>
          <span className="ms">save</span>
          {saving ? "Kaydediliyor..." : "Sıralamayı Kaydet"}
        </button>
      </div>
    </>
  );
}
