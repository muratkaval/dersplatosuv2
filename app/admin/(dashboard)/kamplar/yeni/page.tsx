import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import CampForm from "../camp-form";

export const metadata = { title: "Yeni Kamp | Admin" };

export default async function NewCampPage() {
  const token = await requireAdminToken();

  const [catsRes, insRes, subsRes, booksRes] = await Promise.all([
    adminGet("/categories?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/instructors?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/subjects?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/books?sort=title:asc&pagination[pageSize]=100&fields[0]=title&fields[1]=documentId", token),
  ]);

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/kamplar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Geri
            </Link>
          </div>
          <h1><span className="ms">add_circle</span> Yeni Kamp</h1>
          <p>Yeni bir kamp kaydı oluşturun</p>
        </div>
      </div>

      <div className="admin-content">
        <CampForm 
          categories={catsRes.data?.data || []} 
          instructors={insRes.data?.data || []} 
          subjects={subsRes.data?.data || []} 
          books={booksRes.data?.data || []}
        />
      </div>
    </>
  );
}
