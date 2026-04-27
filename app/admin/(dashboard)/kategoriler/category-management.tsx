"use client";

import React, { useState } from "react";
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

interface Category {
  id: number;
  documentId: string;
  name: string;
  slug?: string;
  sira?: number;
}

interface Props {
  initialCamps: Category[];
  initialBooks: Category[];
  initialSubjects: Category[];
}

type CatType = "categories" | "book-categories" | "subjects";

export default function CategoryManagement({ initialCamps, initialBooks, initialSubjects }: Props) {
  const [camps, setCamps] = useState(initialCamps);
  const [books, setBooks] = useState(initialBooks);
  const [subjects, setSubjects] = useState(initialSubjects);

  const [modal, setModal] = useState<{ open: boolean; type: CatType | null; mode: "new" | "edit"; data: Category | null }>({
    open: false,
    type: null,
    mode: "new",
    data: null,
  });

  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openEdit(type: CatType, cat: Category) {
    setFormName(cat.name);
    setModal({ open: true, type, mode: "edit", data: cat });
  }

  function openNew(type: CatType) {
    setFormName("");
    setModal({ open: true, type, mode: "new", data: null });
  }

  async function handleSave() {
    if (!formName.trim() || !modal.type) return;
    setSaving(true);
    
    try {
      const isEdit = modal.mode === "edit";
      const url = isEdit ? `/api/admin/${modal.type}/${modal.data?.documentId}` : `/api/admin/${modal.type}`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim() }),
      });

      if (res.ok) {
        const result = await res.json();
        const savedItem = result.data;
        
        // Update local state
        const updateState = (prev: Category[]) => {
          if (isEdit) return prev.map((item) => (item.documentId === savedItem.documentId ? savedItem : item));
          return [savedItem, ...prev];
        };

        if (modal.type === "categories") setCamps(updateState);
        else if (modal.type === "book-categories") setBooks(updateState);
        else if (modal.type === "subjects") setSubjects(updateState);

        showToast("Kaydedildi ✓");
        setModal({ ...modal, open: false });
      } else {
        showToast("Hata oluştu", "error");
      }
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(type: CatType, docId: string) {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/${type}/${docId}`, { method: "DELETE" });
      if (res.ok) {
        if (type === "categories") setCamps((p) => p.filter((i) => i.documentId !== docId));
        else if (type === "book-categories") setBooks((p) => p.filter((i) => i.documentId !== docId));
        else if (type === "subjects") setSubjects((p) => p.filter((i) => i.documentId !== docId));
        showToast("Silindi ✓");
      }
    } catch {
      showToast("Hata oluştu", "error");
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        <div>
          <CategoryList title="Kamp Kategorileri" items={camps} type="categories" icon="camping" stateUpdater={setCamps} openNew={openNew} openEdit={openEdit} handleDelete={handleDelete} showToast={showToast} />
          <CategoryList title="Kitap Kategorileri" items={books} type="book-categories" icon="menu_book" stateUpdater={setBooks} openNew={openNew} openEdit={openEdit} handleDelete={handleDelete} showToast={showToast} />
        </div>
        <div>
          <CategoryList title="Branşlar / Dersler" items={subjects} type="subjects" icon="local_offer" stateUpdater={setSubjects} openNew={openNew} openEdit={openEdit} handleDelete={handleDelete} showToast={showToast} />
        </div>
      </div>

      {modal.open && (
        <div className="modal-overlay" onClick={() => !saving && setModal({ ...modal, open: false })}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.mode === "new" ? "Yeni Ekle" : "Düzenle"}</h3>
              <button disabled={saving} onClick={() => setModal({ ...modal, open: false })} className="btn btn-ghost btn-icon">
                <span className="ms">close</span>
              </button>
            </div>
            <div className="form-group">
              <label>Kategori / Branş İsmi</label>
              <input 
                value={formName} 
                onChange={(e) => setFormName(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus 
              />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal({ ...modal, open: false })} disabled={saving}>İptal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ListProps {
  title: string;
  items: Category[];
  type: CatType;
  icon: string;
  stateUpdater: React.Dispatch<React.SetStateAction<Category[]>>;
  openNew: (type: CatType) => void;
  openEdit: (type: CatType, cat: Category) => void;
  handleDelete: (type: CatType, docId: string) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

function CategoryList({ title, items, type, icon, stateUpdater, openNew, openEdit, handleDelete, showToast }: ListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.documentId === active.id);
    const newIndex = items.findIndex((i) => i.documentId === over.id);

    const newOrdered = arrayMove(items, oldIndex, newIndex);
    // Geçici sıra ver
    newOrdered.forEach((item, index) => {
      item.sira = index + 1;
    });

    stateUpdater(newOrdered);
    setHasUnsavedOrder(true);
  }

  async function handleSaveOrder() {
    setSavingOrder(true);
    try {
      for (const item of items) {
        await fetch(`/api/admin/${type}/${item.documentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sira: item.sira }),
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
    <div className="table-card" style={{ marginBottom: "24px" }}>
      <div className="table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="ms">{icon}</span> {title}
          </h3>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            {items.length} Kayıt — Sürükleyerek sıralayın
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {hasUnsavedOrder && (
            <button className="btn btn-success btn-sm" onClick={handleSaveOrder} disabled={savingOrder}>
              <span className="ms">save</span> {savingOrder ? "Kaydediliyor..." : "Sıralamayı Kaydet"}
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => openNew(type)}>
            <span className="ms">add</span> Yeni
          </button>
        </div>
      </div>
      <DndContext id={`dnd-${type}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: "40px" }}>İsim</th>
              <th style={{ textAlign: "center", width: "60px" }}>Sıra</th>
              <th style={{ textAlign: "right", width: "100px" }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={items.map(i => i.documentId)} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <SortableCategoryRow key={item.documentId} item={item} type={type} openEdit={openEdit} handleDelete={handleDelete} />
              ))}
            </SortableContext>
            {items.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>Seçili grupta kayıt yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}

function SortableCategoryRow({ item, type, openEdit, handleDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.documentId });
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition, 
    opacity: isDragging ? 0.5 : 1, 
    zIndex: isDragging ? 1000 : 1,
    background: isDragging ? "rgba(59,130,246,0.05)" : "transparent",
    position: isDragging ? "relative" : "static"
  } as any;

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ borderBottom: "1px solid #1a2536", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="ms" style={{ color: "#475569", cursor: "grab", fontSize: "18px" }} {...attributes} {...listeners}>drag_indicator</span>
          <span style={{ fontWeight: 600, color: "#cbd5e1" }}>{item.name}</span>
        </div>
      </td>
      <td style={{ textAlign: "center", borderBottom: "1px solid #1a2536", color: "#60a5fa", fontWeight: 700, padding: "14px 16px" }}>
        {item.sira || "-"}
      </td>
      <td style={{ borderBottom: "1px solid #1a2536", padding: "14px 16px" }}>
        <div className="td-actions" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(type, item)}>
            <span className="ms">edit</span>
          </button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(type, item.documentId)}>
            <span className="ms">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

