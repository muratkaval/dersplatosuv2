import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/kitaplar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Geri
            </Link>
          </div>
          <h1><span className="ms">library_add</span> Yeni Kitap</h1>
          <p>Sisteme yeni bir kitap kaydı ekleyin</p>
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
