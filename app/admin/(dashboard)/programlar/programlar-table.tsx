"use client";

import { useState } from "react";
import Link from "next/link";

interface ProgramRow {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  examType: string;
  netMin: number | null;
  netMax: number | null;
  subjects: string[];
  duration: string;
  routeCode?: string;
}

interface Props {
  initialPrograms: ProgramRow[];
}

export default function ProgramlarTable({ initialPrograms }: Props) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function deleteProgram(docId: string) {
    if (!confirm("Bu programı silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/admin/programs/${docId}`, { method: "DELETE" });
    if (res.ok) {
      setPrograms((prev) => prev.filter((p) => p.documentId !== docId));
      showToast("Program silindi ✓");
    } else {
      showToast("Silinemedi", "error");
    }
  }

  function netText(p: ProgramRow) {
    const hasMin = typeof p.netMin === "number";
    const hasMax = typeof p.netMax === "number";
    if (!hasMin && !hasMax) return "—";
    if (hasMax && (p.netMax as number) >= 9999) return `${p.netMin}+ net`;
    if (hasMin && hasMax) return `${p.netMin}-${p.netMax} net`;
    return `${p.netMin ?? p.netMax} net`;
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div className="table-card">
        <div className="table-header">
          <h3>{programs.length} Program</h3>
        </div>

        {programs.length === 0 ? (
          <div className="empty-state">
            <span className="ms">calendar_month</span>
            Henüz program yok
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Başlık / Slug</th>
                <th>Sınav</th>
                <th>Net</th>
                <th>Branş</th>
                <th>Süre</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.documentId}>
                  <td>
                    <strong style={{ color: "#e2e8f0" }}>{p.title || "—"}</strong>
                    {p.routeCode && (
                      <span
                        title="Canlı deneme net eşleştirmesine atanmış program"
                        style={{ marginLeft: "8px", fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: "5px", background: "rgba(34,197,94,0.16)", color: "#4ade80", whiteSpace: "nowrap" }}
                      >
                        Rota {p.routeCode}
                      </span>
                    )}
                    <br />
                    <small style={{ color: "#475569" }}>{p.slug}</small>
                  </td>
                  <td>
                    {p.examType ? (
                      <span className="badge badge-blue">{p.examType}</span>
                    ) : (
                      <span className="badge" style={{ background: "#334155" }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "#94a3b8" }}>{netText(p)}</td>
                  <td style={{ color: "#94a3b8" }}>
                    {p.subjects.length > 0 ? p.subjects.join(", ") : "Genel"}
                  </td>
                  <td style={{ color: "#94a3b8" }}>{p.duration}</td>
                  <td>
                    <div className="td-actions">
                      <Link href={`/admin/programlar/${p.documentId}`} className="btn btn-ghost btn-sm btn-icon">
                        <span className="ms">edit</span>
                      </Link>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => deleteProgram(p.documentId)}
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
