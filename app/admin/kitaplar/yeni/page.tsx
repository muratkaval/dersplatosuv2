import { requireAdminToken } from "../../lib/auth";
import { adminGet } from "../../lib/strapi-admin";
import Link from "next/link";
import BookForm from "../book-form";

export const metadata = { title: "Yeni Kitap | Admin" };

export default async function NewBookPage() {
  const token = await requireAdminToken();

  const [subsRes, catsRes, insRes] = await Promise.all([
    adminGet("/subjects?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/book-categories?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/instructors?sort=name:asc&pagination[pageSize]=100", token),
  ]);

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <Link href="/admin/kitaplar" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>
            ← Kitaplar
          </Link>
          <h1><span className="ms">library_add</span> Yeni Kitap</h1>
          <p>Yeni bir kitap kaydı oluştur</p>
        </div>
      </div>

      <div className="admin-content">
        <BookForm 
          subjects={subsRes.data?.data || []} 
          categories={catsRes.data?.data || []} 
          instructors={insRes.data?.data || []} 
        />
      </div>
    </>
  );
}
