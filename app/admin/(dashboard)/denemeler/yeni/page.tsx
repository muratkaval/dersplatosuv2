import { requireAdminToken } from "@/app/admin/lib/auth";
import Link from "next/link";
import DenemeForm from "../deneme-form";

export const metadata = { title: "Yeni Deneme Ekle | Admin" };

export default async function YeniDenemePage() {
  await requireAdminToken();

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/denemeler" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Denemelere Dön
            </Link>
          </div>
          <h1>Yeni Deneme Sınavı</h1>
        </div>
      </div>

      <div className="admin-content">
        <DenemeForm />
      </div>
    </>
  );
}
