import { cookies } from "next/headers";
import { flattenStrapi } from "../../../../lib/strapi";
import { PopupForm } from "./popup-form";
import Link from "next/link";

// Admin formu her zaman GÜNCEL kayıtlı durumu göstersin (revalidate cache'i değil).
export const dynamic = "force-dynamic";

// getGlobalSettings revalidate:60 ile cache'li — kaydettikten hemen sonra reload'da
// eski değeri gösterir (toggle "kapalı" görünürdü). Burada no-store ile taze okuyoruz.
async function getFreshSettings() {
  const token = (process.env.STRAPI_TOKEN || "").trim();
  const base = (process.env.STRAPI_URL || "http://localhost:1340").replace(/\/api\/?$/, "");
  try {
    const res = await fetch(`${base}/api/global-setting?populate=*`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    if (!res.ok) return {};
    const json = await res.json();
    return flattenStrapi(json?.data || {});
  } catch {
    return {};
  }
}

export default async function PopupSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  const initialData = await getFreshSettings();

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/ayarlar" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Ayarlar
            </Link>
          </div>
          <h1><span className="ms">web_asset</span> Popup Alanı</h1>
          <p>Sitede açılan duyuru/popup penceresini buradan yönet.</p>
        </div>
      </div>

      <div className="admin-content">
        <PopupForm initialData={initialData} token={token || ""} />
      </div>
    </>
  );
}
