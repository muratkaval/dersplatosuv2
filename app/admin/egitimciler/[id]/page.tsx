import { requireAdminToken } from "../../lib/auth";
import { adminGet } from "../../lib/strapi-admin";
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
          <Link href="/admin/egitimciler" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>
            ← Eğitimciler
          </Link>
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
