import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProgramForm from "../program-form";

export const metadata = { title: "Program Düzenle | Admin" };

export default async function ProgramDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const token = await requireAdminToken();
  const { id } = await params;

  // Strapi v5 rejects `populate[field]=*` on a specific media/relation; use
  // explicit `=true` and populate the media nested in the `weeks` component.
  const res = await adminGet(
    `/programs/${id}?populate[cover]=true&populate[downloadPdf]=true&populate[subjects]=true&populate[weeks][populate][scheduleImage]=true&populate[weeks][populate][pdf]=true`,
    token
  );
  const program = res.data?.data;
  if (!program) return notFound();

  const [s, gs] = await Promise.all([
    adminGet("/subjects?sort=name:asc&pagination[pageSize]=100", token),
    adminGet("/global-setting", token),
  ]);
  const subjects = s.data?.data || [];
  const exams = gs.data?.data?.programExams || [];
  const nets = gs.data?.data?.programNets || [];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/programlar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Programlara Dön
            </Link>
          </div>
          <h1>Program Düzenle: {program.title}</h1>
        </div>
      </div>

      <div className="admin-content">
        <ProgramForm program={program} subjects={subjects} exams={exams} nets={nets} />
      </div>
    </>
  );
}
