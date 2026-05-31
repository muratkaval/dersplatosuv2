import { requireAdminToken } from "@/app/admin/lib/auth";
import Link from "next/link";
import SayacForm from "../sayac-form";

export const metadata = { title: "Yeni Sayaç Ekle | Admin" };

export default async function YeniSayacPage() {
  await requireAdminToken();

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/sayaclar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Sayaçlara Dön
            </Link>
          </div>
          <h1>Yeni Sayaç</h1>
        </div>
      </div>

      <div className="admin-content">
        <SayacForm />
      </div>
    </>
  );
}
