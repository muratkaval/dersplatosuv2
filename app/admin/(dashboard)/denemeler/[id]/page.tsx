import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import DenemeForm from "../deneme-form";

export const metadata = { title: "Deneme Düzenle | Admin" };

export default async function DenemeDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const token = await requireAdminToken();
  const { id } = await params;

  const res = await adminGet(`/exams/${id}?populate[cover]=true`, token);
  const exam = res.data?.data;

  if (!exam) {
    return notFound();
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/denemeler" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Denemelere Dön
            </Link>
          </div>
          <h1>Deneme Düzenle: {exam.title}</h1>
        </div>
        <div className="topbar-actions">
          <a href={`/denemeler/${exam.slug}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
            <span className="ms">open_in_new</span>
            Sayfayı Aç
          </a>
        </div>
      </div>

      <div className="admin-content">
        <DenemeForm exam={exam} />
      </div>
    </>
  );
}
