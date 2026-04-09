import { requireAdminToken } from "../../lib/auth";
import { adminGet } from "../../lib/strapi-admin";
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
          <Link href="/admin/kamplar" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>
            ← Kamplar
          </Link>
          <h1><span className="ms">add_circle</span> Yeni Kamp</h1>
          <p>Yeni kamp oluştur</p>
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
