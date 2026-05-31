"use client";

import { useState } from "react";
import Link from "next/link";

interface Countdown {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  targetDate: string;
  enabled: boolean;
  showOnHomepage: boolean;
}

interface Props {
  initialCountdowns: Countdown[];
}

export default function SayaclarTable({ initialCountdowns }: Props) {
  const [countdowns, setCountdowns] = useState(initialCountdowns);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function deleteCountdown(docId: string) {
    if (!confirm("Bu sayacı silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/countdowns/${docId}`, { method: "DELETE" });
    if (res.ok) {
      setCountdowns((prev) => prev.filter((c) => c.documentId !== docId));
      showToast("Sayaç silindi ✓");
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
          <h3>{countdowns.length} Sayaç</h3>
        </div>

        {countdowns.length === 0 ? (
          <div className="empty-state">
            <span className="ms">timer</span>
            Henüz sayaç yok
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Başlık / Slug</th>
                <th>Sınav Tarihi</th>
                <th>Durum</th>
                <th>Anasayfa</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {countdowns.map((c) => (
                <tr key={c.documentId}>
                  <td>
                    <strong style={{ color: "#e2e8f0" }}>{c.title || "—"}</strong>
                    <br />
                    <small style={{ color: "#475569" }}>{c.slug}</small>
                  </td>
                  <td style={{ color: "#94a3b8" }}>
                    {new Date(c.targetDate).toLocaleString("tr-TR")}
                  </td>
                  <td>
                    {c.enabled ? (
                      <span className="badge badge-success">Aktif</span>
                    ) : (
                      <span className="badge badge-error">Pasif</span>
                    )}
                  </td>
                  <td>
                    {c.showOnHomepage ? (
                      <span className="badge badge-blue">Görünür</span>
                    ) : (
                      <span className="badge" style={{ background: "#334155" }}>Gizli</span>
                    )}
                  </td>
                  <td>
                    <div className="td-actions">
                      <Link href={`/admin/sayaclar/${c.documentId}`} className="btn btn-ghost btn-sm btn-icon">
                        <span className="ms">edit</span>
                      </Link>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => deleteCountdown(c.documentId)}
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
    </>
  );
}
