import { requireAdminToken } from "./lib/auth";
import { adminGet } from "./lib/strapi-admin";
import Link from "next/link";

export default async function AdminDashboard() {
  const token = await requireAdminToken();

  const [camps, books, instructors, solutionVideos] = await Promise.all([
    adminGet("/camps?pagination[pageSize]=1&fields[0]=id", token),
    adminGet("/books?pagination[pageSize]=1&fields[0]=id", token),
    adminGet("/instructors?pagination[pageSize]=1&fields[0]=id", token),
    adminGet("/solution-videos?pagination[pageSize]=1&fields[0]=id", token),
  ]);

  const stats = [
    { label: "Kamplar", count: camps.data?.meta?.pagination?.total ?? "—", icon: "camping", href: "/admin/kamplar", color: "#3b82f6" },
    { label: "Kitaplar", count: books.data?.meta?.pagination?.total ?? "—", icon: "menu_book", href: "/admin/kitaplar", color: "#10b981" },
    { label: "Eğitimciler", count: instructors.data?.meta?.pagination?.total ?? "—", icon: "supervisor_account", href: "/admin/egitimciler", color: "#f59e0b" },
    { label: "Video Çözümler", count: solutionVideos.data?.meta?.pagination?.total ?? "—", icon: "play_circle", href: "/admin/soru-cozumleri", color: "#8b5cf6" },
  ];

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <h1><span className="ms">dashboard</span> Dashboard</h1>
          <p>Ders Platosu içerik yönetim paneline hoş geldiniz</p>
        </div>
      </div>

      <div className="admin-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {stats.map((s) => (
            <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
              <div className="info-card" style={{ cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = s.color)}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "")}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "12px",
                    background: `${s.color}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="ms" style={{ fontSize: "22px", color: s.color }}>{s.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff" }}>{s.count}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{s.label}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[
            { href: "/admin/kamplar/yeni", icon: "add_circle", label: "Yeni Kamp Ekle", color: "#3b82f6" },
            { href: "/admin/kitaplar/yeni", icon: "library_add", label: "Yeni Kitap Ekle", color: "#10b981" },
            { href: "/admin/soru-cozumleri/yeni", icon: "video_call", label: "Yeni Video Çözümü Ekle", color: "#8b5cf6" },
            { href: "/admin/egitimciler/yeni", icon: "person_add", label: "Yeni Eğitimci Ekle", color: "#f59e0b" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="btn btn-ghost" style={{ justifyContent: "flex-start", padding: "14px 18px" }}>
              <span className="ms" style={{ color: a.color }}>{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
