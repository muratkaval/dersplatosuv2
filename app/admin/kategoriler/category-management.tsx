"use client";

import { useState } from "react";

interface Category {
  id: number;
  documentId: string;
  name: string;
  slug?: string;
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

  const List = ({ title, items, type, icon }: { title: string; items: Category[]; type: CatType; icon: string }) => (
    <div className="table-card" style={{ marginBottom: "24px" }}>
      <div className="table-header">
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="ms">{icon}</span> {title}
        </h3>
        <button className="btn btn-primary btn-sm" onClick={() => openNew(type)}>
          <span className="ms">add</span> Yeni
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>İsim</th>
            <th style={{ textAlign: "right" }}>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.documentId}>
              <td>{item.name}</td>
              <td>
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
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={2} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>Seçili grupta kayıt yok.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        <div>
          <List title="Kamp Kategorileri" items={camps} type="categories" icon="camping" />
          <List title="Kitap Kategorileri" items={books} type="book-categories" icon="menu_book" />
        </div>
        <div>
          <List title="Branşlar / Dersler" items={subjects} type="subjects" icon="local_offer" />
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
