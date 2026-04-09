import { requireAdminToken } from "../lib/auth";
import { adminGet } from "../lib/strapi-admin";
import Link from "next/link";
import CampsTable from "./camps-table";

export const metadata = { title: "Kamplar | Admin" };

export default async function KamplarPage() {
  const token = await requireAdminToken();

  const d = await adminGet(
    "/camps?populate[instructors][fields][0]=name&populate[categories][fields][0]=name&sort=createdAt:desc&pagination[pageSize]=100",
    token
  );

  const camps = (d.data?.data || []).map((item: any) => ({
    id: item.id,
    documentId: item.documentId || String(item.id),
    title: item.title,
    slug: item.slug,
    categories: item.categories || [],
    instructors: item.instructors || [],
  }));

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <h1><span className="ms">camping</span> Kamplar</h1>
          <p>Sürükleyerek sıralayın, ardından "Sıralamayı Kaydet" butonuna basın</p>
        </div>
        <div className="topbar-actions">
          <Link href="/admin/kamplar/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Yeni Kamp
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <CampsTable initialCamps={camps} />
      </div>
    </>
  );
}
