import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import BookForm from "../book-form";

interface Props { params: Promise<{ id: string }> }

export default async function EditBookPage({ params }: Props) {
  const { id } = await params;
  const token = await requireAdminToken();

  const [bookRes, subsRes, catsRes, insRes] = await Promise.all([
    adminGet(`/books/${id}?populate=*`, token),
    adminGet("/subjects?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/book-categories?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/instructors?sort=name:asc&pagination[pageSize]=100", token),
  ]);

  const book = bookRes.data?.data;
  if (!book) return notFound();

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/kitaplar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Geri
            </Link>
          </div>
          <h1><span className="ms">edit</span> {book.title || "Kitabı Düzenle"}</h1>
          <p>Kitap bilgilerini ve ilişkilerini güncelleyin</p>
        </div>
      </div>

      <div className="admin-content">
        <BookForm 
          book={book} 
          subjects={subsRes.data?.data || []} 
          categories={catsRes.data?.data || []} 
          instructors={insRes.data?.data || []} 
        />
      </div>
    </>
  );
}
