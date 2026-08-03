import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import DenemelerTable from "./denemeler-table";

export const metadata = { title: "Denemeler | Admin" };

function faqCount(raw: any): number {
  let list = raw;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return 0;
    }
  }
  return Array.isArray(list) ? list.length : 0;
}

export default async function DenemelerPage() {
  const token = await requireAdminToken();

  const d = await adminGet(
    "/exams?sort[0]=displayOrder:asc&sort[1]=createdAt:desc&pagination[pageSize]=100",
    token
  );

  const exams = (d.data?.data || []).map((item: any) => ({
    id: item.id,
    documentId: item.documentId || String(item.id),
    title: item.title,
    slug: item.slug,
    examDate: item.examDate || null,
    enabled: item.enabled ?? true,
    faqCount: faqCount(item.faq),
  }));

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Dashboard
            </Link>
          </div>
          <h1><span className="ms">fact_check</span> Denemeler</h1>
          <p>Deneme sınavı tanıtım sayfalarını buradan yönetebilirsiniz.</p>
        </div>
        <div className="topbar-actions">
          <Link href="/admin/denemeler/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Yeni Sınav Ekle
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <DenemelerTable initialExams={exams} />
      </div>
    </>
  );
}
