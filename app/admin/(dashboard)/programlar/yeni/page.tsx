import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import ProgramForm from "../program-form";

export const metadata = { title: "Yeni Program Ekle | Admin" };

export default async function YeniProgramPage() {
  const token = await requireAdminToken();
  const [s, gs, bk] = await Promise.all([
    adminGet("/subjects?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/global-setting", token),
    adminGet("/books?populate[cover]=true&sort=title:asc&pagination[pageSize]=100", token),
  ]);
  const subjects = s.data?.data || [];
  const exams = gs.data?.data?.programExams || [];
  const nets = gs.data?.data?.programNets || [];
  const books = bk.data?.data || [];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/programlar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Programlara Dön
            </Link>
          </div>
          <h1>Yeni Program</h1>
        </div>
      </div>

      <div className="admin-content">
        <ProgramForm subjects={subjects} exams={exams} nets={nets} books={books} />
      </div>
    </>
  );
}
