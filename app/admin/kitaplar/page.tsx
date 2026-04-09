import { requireAdminToken } from "../lib/auth";
import { adminGet } from "../lib/strapi-admin";
import Link from "next/link";

export const metadata = { title: "Kitaplar | Admin" };

export default async function KitaplarPage() {
  const token = await requireAdminToken();
  const d = await adminGet(
    "/books?populate[cover][fields][0]=url&populate[subjects][fields][0]=name&sort=createdAt:desc&pagination[pageSize]=100",
    token
  );
  const books = d.data?.data || [];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <h1><span className="ms">menu_book</span> Kitaplar</h1>
          <p>Tüm yayınlar</p>
        </div>
        <div className="topbar-actions">
          <Link href="/admin/kitaplar/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Yeni Kitap
          </Link>
        </div>
      </div>

      <div className="admin-content">
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
                          <img src={coverUrl.startsWith("http") ? coverUrl : `${process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340"}${coverUrl}`}
                            className="book-thumb" alt={book.title} />
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
                          <DeleteButton docId={docId} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

// Inline delete button (client)
function DeleteButton({ docId }: { docId: string }) {
  return (
    <form action={async () => {
      "use server";
      // Silme server action burada
    }}>
      <Link href={`/admin/kitaplar/${docId}/sil`} className="btn btn-danger btn-sm btn-icon"
        onClick={(e) => {
          if (!confirm("Bu kitabı silmek istediğinize emin misiniz?")) e.preventDefault();
        }}>
        <span className="ms">delete</span>
      </Link>
    </form>
  );
}
