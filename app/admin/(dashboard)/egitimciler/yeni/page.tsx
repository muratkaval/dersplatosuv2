import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import InstructorForm from "../instructor-form";

export const metadata = { title: "Yeni Eğitimci | Admin" };

export default async function NewInstructorPage() {
  const token = await requireAdminToken();

  const subsRes = await adminGet("/subjects?sort=name:asc&pagination[pageSize]=100", token);

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <Link href="/admin/egitimciler" style={{ color: "#64748b", fontSize: "0.8rem", textDecoration: "none" }}>
            ← Eğitimciler
          </Link>
          <h1><span className="ms">person_add</span> Yeni Eğitimci</h1>
          <p>Sisteme yeni bir hoca kaydı ekleyin</p>
        </div>
      </div>

      <div className="admin-content">
        <InstructorForm subjects={subsRes.data?.data || []} />
      </div>
    </>
  );
}
