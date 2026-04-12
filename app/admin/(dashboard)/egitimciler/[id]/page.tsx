import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import InstructorForm from "../instructor-form";

interface Props { params: Promise<{ id: string }> }

export default async function EditInstructorPage({ params }: Props) {
  const { id } = await params;
  const token = await requireAdminToken();

  const [insRes, subsRes] = await Promise.all([
    adminGet(`/instructors/${id}?populate=*`, token),
    adminGet("/subjects?sort=name:asc&pagination[pageSize]=100", token),
  ]);

  const instructor = insRes.data?.data;
  if (!instructor) return notFound();

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/egitimciler" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Geri
            </Link>
          </div>
          <h1><span className="ms">edit</span> {instructor.name || "Eğitimci Düzenle"}</h1>
          <p>Eğitimci bilgilerini ve profil fotoğrafını güncelleyin</p>
        </div>
      </div>

      <div className="admin-content">
        <InstructorForm instructor={instructor} subjects={subsRes.data?.data || []} />
      </div>
    </>
  );
}
