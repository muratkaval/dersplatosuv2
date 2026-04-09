import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import CampForm from "../camp-form";

interface Props { params: Promise<{ id: string }> }

export default async function EditCampPage({ params }: Props) {
  const { id } = await params;
  const token = await requireAdminToken();

  const [campRes, catsRes, insRes, subsRes, booksRes] = await Promise.all([
    adminGet(`/camps/${id}?populate=*`, token),
    adminGet("/categories?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/instructors?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/subjects?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/books?sort=title:asc&pagination[pageSize]=100&fields[0]=title&fields[1]=documentId", token),
  ]);

  const camp = campRes.data?.data;
  if (!camp) return notFound();

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <Link href="/admin/kamplar" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>
            ← Kamplar
          </Link>
          <h1><span className="ms">edit</span> {camp.title || "Kampı Düzenle"}</h1>
          <p>Kamp bilgilerini ve ders programını güncelleyin</p>
        </div>
      </div>

      <div className="admin-content">
        <CampForm 
          camp={camp}
          categories={catsRes.data?.data || []}
          instructors={insRes.data?.data || []}
          subjects={subsRes.data?.data || []}
          books={booksRes.data?.data || []}
        />
      </div>
    </>
  );
}
