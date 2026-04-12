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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/egitimciler" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Geri
            </Link>
          </div>
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
