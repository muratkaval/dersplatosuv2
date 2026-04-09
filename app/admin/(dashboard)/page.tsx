import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          {stats.map((s) => (
            <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
              <div 
                className="info-card stat-card-hover" 
                style={{ 
                  "--hover-color": s.color 
                } as any}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-dim)", marginBottom: "8px" }}>{s.label}</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{s.count}</div>
                  </div>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: `${s.color}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${s.color}35`,
                    boxShadow: `0 0 15px -5px ${s.color}`
                  }}>
                    <span className="ms" style={{ fontSize: "24px", color: s.color }}>{s.icon}</span>
                  </div>
                </div>
                {/* Decorative background glow */}
                <div style={{
                  position: "absolute", bottom: "-30px", right: "-30px",
                  width: "120px", height: "120px", borderRadius: "50%",
                  background: s.color, filter: "blur(40px)", opacity: 0.2,
                  pointerEvents: "none"
                }}></div>
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

