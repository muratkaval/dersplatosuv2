import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import InstructorsTable from "./instructors-table";
import PageHeaderEditor from "../page-header-editor";

export const metadata = { title: "Eğitimciler | Admin" };

export default async function EgitimcilerPage() {
  const token = await requireAdminToken();
  const d = await adminGet(
    "/instructors?populate[photo][fields][0]=url&populate[subjects][fields][0]=name&sort=displayOrder:asc&pagination[pageSize]=100",
    token
  );
  
  const gs = await adminGet("/global-setting", token);
  const pageHeaders = gs.data?.data?.pageHeaders || {};

  const instructors = d.data?.data || [];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Dashboard
            </Link>
          </div>
          <h1><span className="ms">supervisor_account</span> Eğitimciler</h1>
          <p>Sisteme kayıtlı youtuber hocalarımız</p>
        </div>
        <div className="topbar-actions">
          <PageHeaderEditor pageKey="youtuber-hocalar" allHeaders={pageHeaders} defaults={{ title: "Youtuber", highlight: "Hocalarımız", subtitle: "Alanında uzman, deneyimli öğretmenlerle çalış ve başarı sağla" }} />
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

