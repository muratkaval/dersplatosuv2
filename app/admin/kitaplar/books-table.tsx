"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  initialBooks: any[];
}

export default function BooksTable({ initialBooks }: Props) {
  const [books, setBooks] = useState(initialBooks);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function deleteBook(docId: string) {
    if (!confirm("Bu kitabı silmek istediğinize emin misiniz?")) return;
    
    try {
      const res = await fetch(`/api/admin/books/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.documentId !== docId));
        showToast("Kitap silindi ✓");
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
          <h3>{books.length} Kitap</h3>
        </div>

        {books.length === 0 ? (
          <div className="empty-state">
            <span className="ms">menu_book</span>
            Henüz kitap yok
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Kapak</th>
                <th>Başlık</th>
                <th>Branş</th>
                <th>Öne Çıkan</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book: any) => {
                const coverUrl = book.cover?.url || "";
                const subjects = (book.subjects || []).map((s: any) => s.name).join(", ") || "—";
                const docId = book.documentId || String(book.id);

                return (
                  <tr key={docId}>
                    <td>
                      {coverUrl ? (
                        <img 
                          src={coverUrl.startsWith("http") ? coverUrl : `${process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340"}${coverUrl}`} 
                          className="book-thumb" 
                          alt={book.title} 
                        />
                      ) : (
                        <div className="book-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "0.65rem" }}>
                          Yok
                        </div>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: "#e2e8f0" }}>{book.title || "—"}</strong>
                    </td>
                    <td>
                      <span className="badge badge-blue">{subjects}</span>
                    </td>
                    <td>
                      {book.featured && <span className="ms" style={{ color: "#fbbf24" }}>star</span>}
                    </td>
                    <td>
                      <div className="td-actions">
                        <Link href={`/admin/kitaplar/${docId}`} className="btn btn-ghost btn-sm btn-icon">
                          <span className="ms">edit</span>
                        </Link>
                        <button 
                          className="btn btn-danger btn-sm btn-icon" 
                          onClick={() => deleteBook(docId)}
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
