import { redirect } from "next/navigation";
import { getAdminToken, logoutAction } from "@/app/admin/lib/auth";
import Link from "next/link";
import AdminNav from "./admin-nav";
import AdminMobileToggle from "./admin-mobile-toggle";
import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin | Ders Platosu",
  robots: { index: false, follow: false },
};

const navItems = [
  { section: "İçerik" },
  { href: "/admin/kamplar", icon: "camping", label: "Kamplar" },
  { href: "/admin/kitaplar", icon: "menu_book", label: "Kitaplar" },
  { href: "/admin/soru-cozumleri", icon: "play_circle", label: "Soru Çözümleri" },
  { href: "/admin/egitimciler", icon: "supervisor_account", label: "Eğitimciler" },
  { section: "Kategoriler" },
  { href: "/admin/kategoriler", icon: "local_offer", label: "Kategoriler" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = await getAdminToken();
  if (!token) redirect("/admin/login");

  return (
    <div className="admin-layout">
      {/* Mobil hamburger + arka plan (yalnız ≤768px görünür) */}
      <AdminMobileToggle />

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <strong>
            <span className="ms">school</span>
            Ders Platosu
          </strong>
          <span>Admin Paneli</span>
        </div>

        <AdminNav />

        <div className="sidebar-footer">
          <form action={logoutAction}>
            <button type="submit" className="btn btn-logout">
              <span className="ms">logout</span>
              Çıkış
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}

