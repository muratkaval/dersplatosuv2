"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  initialInstructors: any[];
}

export default function InstructorsTable({ initialInstructors }: Props) {
  const [instructors, setInstructors] = useState(initialInstructors);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function deleteInstructor(docId: string) {
    if (!confirm("Bu eğitimciyi silmek istediğinize emin misiniz?")) return;
    
    try {
      const res = await fetch(`/api/admin/instructors/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setInstructors((prev) => prev.filter((i) => i.documentId !== docId));
        showToast("Eğitimci silindi ✓");
      } else {
        showToast("Silinemedi", "error");
      }
    } catch {
      showToast("Bağlantı hatası", "error");
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div className="table-card">
        <div className="table-header">
          <h3>{instructors.length} Eğitimci</h3>
        </div>

        {instructors.length === 0 ? (
          <div className="empty-state">
            <span className="ms">supervisor_account</span>
            Henüz eğitimci yok
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Foto</th>
                <th>İsim</th>
                <th>Branşlar</th>
                <th>Sosyal Medya</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((ins: any) => {
                const photoUrl = ins.photo?.url || "";
                const subs = (ins.subjects || []).map((s: any) => s.name).join(", ") || "—";
                const docId = ins.documentId || String(ins.id);

                return (
                  <tr key={docId}>
                    <td>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "#1e3a5f", overflow: "hidden", display: "flex",
                        alignItems: "center", justifyContent: "center"
                      }}>
                        {photoUrl ? (
                          <img 
                            src={photoUrl.startsWith("http") ? photoUrl : `${process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340"}${photoUrl}`} 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                            alt={ins.name} 
                          />
                        ) : (
                          <span className="ms" style={{ fontSize: "18px", color: "#64748b" }}>person</span>
                        )}
                      </div>
                    </td>
                    <td><strong style={{ color: "#e2e8f0" }}>{ins.name}</strong></td>
                    <td><span className="badge badge-blue">{subs}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {ins.youtube && <span className="ms" style={{ color: "#ef4444", fontSize: "16px" }}>play_circle</span>}
                        {ins.instagram && <span className="ms" style={{ color: "#ec4899", fontSize: "16px" }}>photo_camera</span>}
                        {!ins.youtube && !ins.instagram && "—"}
                      </div>
                    </td>
                    <td>
                      <div className="td-actions">
                        <Link href={`/admin/egitimciler/${docId}`} className="btn btn-ghost btn-sm btn-icon">
                          <span className="ms">edit</span>
                        </Link>
                        <button 
                          className="btn btn-danger btn-sm btn-icon" 
                          onClick={() => deleteInstructor(docId)}
                        >
                          <span className="ms">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
