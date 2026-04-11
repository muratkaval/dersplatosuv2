"use client";

import { useState } from "react";
import Link from "next/link";
import { toMediaUrl } from "@/app/lib/strapi";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  initialInstructors: any[];
}

export default function InstructorsTable({ initialInstructors }: Props) {
  const [instructors, setInstructors] = useState(initialInstructors);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = instructors.findIndex((i) => i.documentId === active.id);
    const newIndex = instructors.findIndex((i) => i.documentId === over.id);

    const newOrdered = arrayMove(instructors, oldIndex, newIndex);
    // Sıra numaralarını güncelle
    newOrdered.forEach((item, index) => {
      item.displayOrder = index + 1;
    });

    setInstructors(newOrdered);
    setHasUnsavedOrder(true);
  }

  async function handleSaveOrder() {
    setSavingOrder(true);
    try {
      for (const item of instructors) {
        await fetch(`/api/admin/instructors/${item.documentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: item.displayOrder }),
        });
      }
      showToast("Sıralama Kaydedildi ✓");
      setHasUnsavedOrder(false);
    } catch {
      showToast("Sıralama güncellenemedi", "error");
    } finally {
      setSavingOrder(false);
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div className="table-card">
        <div className="table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>{instructors.length} Eğitimci</h3>
          {hasUnsavedOrder && (
            <button className="btn btn-success btn-sm" onClick={handleSaveOrder} disabled={savingOrder}>
              <span className="ms">save</span> {savingOrder ? "Kaydediliyor..." : "Sıralamayı Kaydet"}
            </button>
          )}
        </div>

        {instructors.length === 0 ? (
          <div className="empty-state">
            <span className="ms">supervisor_account</span>
            Henüz eğitimci yok
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}></th>
                  <th>Foto</th>
                  <th>İsim</th>
                  <th>Branşlar</th>
                  <th>Sosyal Medya</th>
                  <th style={{ textAlign: "center", width: "80px" }}>Sıra</th>
                  <th style={{ textAlign: "right", width: "100px" }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext items={instructors.map(i => i.documentId)} strategy={verticalListSortingStrategy}>
                  {instructors.map((ins: any) => (
                    <SortableInstructorRow key={ins.documentId} ins={ins} deleteInstructor={deleteInstructor} />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        )}
      </div>
    </>
  );
}

function SortableInstructorRow({ ins, deleteInstructor }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ins.documentId });
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition, 
    opacity: isDragging ? 0.5 : 1, 
    zIndex: isDragging ? 1000 : 1,
    background: isDragging ? "rgba(59,130,246,0.05)" : "transparent",
    position: (isDragging ? "relative" : "static") as any
  };

  const photoUrl = ins.photo?.url || "";
  const subs = (ins.subjects || []).map((s: any) => s.name).join(", ") || "—";
  const docId = ins.documentId || String(ins.id);

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ textAlign: "center" }}>
        <span className="ms" style={{ color: "#475569", cursor: "grab", fontSize: "18px" }} {...attributes} {...listeners}>drag_indicator</span>
      </td>
      <td>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "#1e3a5f", overflow: "hidden", display: "flex",
          alignItems: "center", justifyContent: "center"
        }}>
          {ins.photo ? (
            <img 
              src={toMediaUrl(ins.photo)} 
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
      <td style={{ textAlign: "center", color: "#60a5fa", fontWeight: 700 }}>
        {ins.displayOrder || "-"}
      </td>
      <td>
        <div className="td-actions" style={{ justifyContent: "flex-end" }}>
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
}
