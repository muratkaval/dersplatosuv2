import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import ProgramlarTable from "./programlar-table";
import PageHeaderEditor from "../page-header-editor";
import { periodUnitWord, programDurationCount } from "@/app/lib/strapi";

export const metadata = { title: "Programlar | Admin" };

export default async function ProgramlarPage() {
  const token = await requireAdminToken();

  const d = await adminGet(
    "/programs?populate=*&sort=displayOrder:asc&pagination[pageSize]=100",
    token
  );

  const gs = await adminGet("/global-setting", token);
  const pageHeaders = gs.data?.data?.pageHeaders || {};

  const programs = (d.data?.data || []).map((item: any) => {
    const count = programDurationCount(item);
    return {
      id: item.id,
      documentId: item.documentId || String(item.id),
      title: item.title,
      slug: item.slug,
      examType: item.examType,
      netMin: item.netMin,
      netMax: item.netMax,
      subjects: (item.subjects || []).map((s: any) => s.name).filter(Boolean),
      duration: count > 0 ? `${count} ${periodUnitWord(item.periodType).toLowerCase()}` : "—",
    };
  });

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Dashboard
            </Link>
          </div>
          <h1><span className="ms">calendar_month</span> Programlar</h1>
          <p>Sınav ve net aralığına göre filtrelenen çalışma programlarını yönetin.</p>
        </div>
        <div className="topbar-actions">
          <PageHeaderEditor pageKey="programlar" allHeaders={pageHeaders} defaults={{ title: "Ders Platosu", highlight: "Programları", subtitle: "Sınavını ve net aralığını seç, sana uygun çalışma programını indir." }} />
          <Link href="/admin/programlar/ayarlar" className="btn btn-ghost">
            <span className="ms">tune</span>
            Ayarlar
          </Link>
          <Link href="/admin/programlar/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Yeni Program
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <ProgramlarTable initialPrograms={programs} />
      </div>
    </>
  );
}
