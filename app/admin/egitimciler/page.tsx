import { requireAdminToken } from "../lib/auth";
import { adminGet } from "../lib/strapi-admin";
import Link from "next/link";
import InstructorsTable from "./instructors-table";

export const metadata = { title: "Eğitimciler | Admin" };

export default async function EgitimcilerPage() {
  const token = await requireAdminToken();
  const d = await adminGet(
    "/instructors?populate[photo][fields][0]=url&populate[subjects][fields][0]=name&sort=name:asc&pagination[pageSize]=100",
    token
  );
  
  const instructors = d.data?.data || [];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <h1><span className="ms">supervisor_account</span> Eğitimciler</h1>
          <p>Sisteme kayıtlı youtuber hocalarımız</p>
        </div>
        <div className="topbar-actions">
          <Link href="/admin/egitimciler/yeni" className="btn btn-primary">
            <span className="ms">person_add</span>
            Yeni Eğitimci
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <InstructorsTable initialInstructors={instructors} />
      </div>
    </>
  );
}
