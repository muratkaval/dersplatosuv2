"use client";

import { useState } from "react";
import Link from "next/link";

interface Exam {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  examDate?: string | null;
  enabled: boolean;
  faqCount: number;
}

interface Props {
  initialExams: Exam[];
}

export default function DenemelerTable({ initialExams }: Props) {
  const [exams, setExams] = useState(initialExams);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function deleteExam(docId: string) {
    if (!confirm("Bu deneme sınavını silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/exams/${docId}`, { method: "DELETE" });
    if (res.ok) {
      setExams((prev) => prev.filter((e) => e.documentId !== docId));
      showToast("Deneme silindi ✓");
    } else {
      showToast("Silinemedi", "error");
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div className="table-card">
        <div className="table-header">
          <h3>{exams.length} Deneme</h3>
        </div>

        {exams.length === 0 ? (
          <div className="empty-state">
            <span className="ms">fact_check</span>
            Henüz deneme sınavı yok
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Başlık / Slug</th>
                <th>Sınav Tarihi</th>
                <th>SSS</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.documentId}>
                  <td>
                    <strong style={{ color: "#e2e8f0" }}>{e.title || "—"}</strong>
                    <br />
                    <small style={{ color: "#475569" }}>/denemeler/{e.slug}</small>
                  </td>
                  <td style={{ color: "#94a3b8" }}>
                    {e.examDate ? new Date(e.examDate).toLocaleString("tr-TR") : "—"}
                  </td>
                  <td style={{ color: "#94a3b8" }}>{e.faqCount} soru</td>
                  <td>
                    {e.enabled ? (
                      <span className="badge badge-success">Yayında</span>
                    ) : (
                      <span className="badge badge-error">Taslak</span>
                    )}
                  </td>
                  <td>
                    <div className="td-actions">
                      <Link href={`/admin/denemeler/${e.documentId}`} className="btn btn-ghost btn-sm btn-icon" title="Düzenle">
                        <span className="ms">edit</span>
                      </Link>
                      <a
                        href={`/denemeler/${e.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Sayfayı aç"
                      >
                        <span className="ms">open_in_new</span>
                      </a>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => deleteExam(e.documentId)}
                        title="Sil"
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
