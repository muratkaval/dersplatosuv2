import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import BooksTable from "./books-table";
import PageHeaderEditor from "../page-header-editor";

export const metadata = { title: "Kitaplar | Admin" };

export default async function KitaplarPage() {
  const token = await requireAdminToken();
  const d = await adminGet(
    "/books?populate[cover][fields][0]=url&populate[subjects][fields][0]=name&sort=createdAt:desc&pagination[pageSize]=100",
    token
  );
  
  const gs = await adminGet("/global-setting", token);
  const pageHeaders = gs.data?.data?.pageHeaders || {};

  const books = d.data?.data || [];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Dashboard
            </Link>
          </div>
          <h1><span className="ms">menu_book</span> Kitaplar</h1>
          <p>Tüm yayınlar ve soru bankaları</p>
        </div>
        <div className="topbar-actions">
          <PageHeaderEditor pageKey="kitaplar" allHeaders={pageHeaders} defaults={{ title: "Ders Platosu", highlight: "Kitapları", subtitle: "Ders Platosu hocaları ve yayınlar ile özel olarak hazırlanmış kitaplar" }} />
          <Link href="/admin/kitaplar/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Yeni Kitap
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <BooksTable initialBooks={books} />
      </div>
    </>
  );
}

