import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import { PageForm } from "./page-form";

export const metadata = { title: "Sayfa Düzenle | Admin" };

export default async function SayfaDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await requireAdminToken();

  let initialData: any = null;
  let isNew = id === "yeni";

  if (!isNew) {
    const isNumeric = /^\d+$/.test(id);
    const filter = isNumeric
      ? `/pages?filters[id][$eq]=${id}&pagination[pageSize]=1`
      : `/pages?filters[documentId][$eq]=${id}&pagination[pageSize]=1`;
    const d = await adminGet(filter, token);
    initialData = d.data?.data?.[0] || null;
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Link href="/admin/sayfalar" className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>
              <span className="ms" style={{ fontSize: "18px" }}>arrow_back</span>
              Sayfalar
            </Link>
          </div>
          <h1><span className="ms">edit_document</span> {isNew ? "Yeni Sayfa" : "Sayfa Düzenle"}</h1>
          <p>{isNew ? "Yeni bir statik sayfa oluştur" : "İçerik ve başlığı güncelle"}</p>
        </div>
      </div>

      <div className="admin-content">
        <PageForm initialData={initialData} pageId={isNew ? null : id} token={token} />
      </div>
    </>
  );
}
