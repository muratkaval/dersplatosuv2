import { requireAdminToken } from "@/app/admin/lib/auth";
import Link from "next/link";
import AnalizForm from "../analiz-form";

export const metadata = { title: "Yeni Analiz | Admin" };

export default async function YeniAnalizPage() {
  await requireAdminToken();

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link
              href="/admin/analiz"
              style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}
            >
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Deneme Analizi
            </Link>
          </div>
          <h1>Yeni Analiz</h1>
          <p>Bir deneme için eşikleri belirleyin; programları sonraki adımda eklersiniz.</p>
        </div>
      </div>

      <div className="admin-content">
        <AnalizForm />
      </div>
    </>
  );
}
