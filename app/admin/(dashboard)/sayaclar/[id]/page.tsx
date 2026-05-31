import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import SayacForm from "../sayac-form";

export const metadata = { title: "Sayaç Düzenle | Admin" };

export default async function SayacDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const token = await requireAdminToken();
  const { id } = await params;

  const res = await adminGet(`/countdowns/${id}?populate=*`, token);
  const countdown = res.data?.data;

  if (!countdown) {
    return notFound();
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/sayaclar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Sayaçlara Dön
            </Link>
          </div>
          <h1>Sayaç Düzenle: {countdown.title}</h1>
        </div>
      </div>

      <div className="admin-content">
        <SayacForm countdown={countdown} />
      </div>
    </>
  );
}
