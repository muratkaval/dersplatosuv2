import { SiteHeader, SiteFooter, type NavLink, type FooterColumn } from "./site-nav";

// Re-export for any module importing these from site-layout (backward compat)
export { SiteHeader, SiteFooter };

// Server-side nav fetch. Uses the TRIMMED token (matching strapi-admin) because
// navLinks only come back with that token, and `revalidate` (NOT no-store) so the
// route stays static/ISR — a no-store fetch here would make every page dynamic and
// re-trigger the "static to dynamic at runtime" 500 on routes like /[slug].
async function getNavData(): Promise<{ navLinks?: NavLink[]; footerColumns?: FooterColumn[]; logo?: any[]; headerLogo?: any }> {
  const token = (process.env.STRAPI_TOKEN || "").trim();
  const base = (process.env.STRAPI_URL || "http://localhost:1340").replace(/\/api\/?$/, "");
  try {
    const res = await fetch(`${base}/api/global-setting?populate=*`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      next: { revalidate: 60 },
    });
    if (!res.ok) return {};
    const json = await res.json();
    const d = json?.data?.attributes || json?.data || {};
    return {
      navLinks: Array.isArray(d.navLinks) && d.navLinks.length ? d.navLinks : undefined,
      footerColumns: Array.isArray(d.footerColumns) && d.footerColumns.length ? d.footerColumns : undefined,
      logo: Array.isArray(d.logo) ? d.logo : (d.logo ? [d.logo] : undefined),
      // Header'a özel tekli logo. Boşsa SiteHeader footer logolarının ilkine, o da yoksa /logo.png'e düşer.
      headerLogo: d.headerLogo || undefined,
    };
  } catch {
    return {};
  }
}

export async function PageContainer({ children, navLinks, footerColumns }: {
  children: React.ReactNode;
  navLinks?: NavLink[];
  footerColumns?: FooterColumn[];
}) {
  let nav = navLinks;
  let cols = footerColumns;

  // Fetch nav + logolar server-side so the menu/footer render correctly on first
  // paint (no client-side fetch flash). Logolar prop olarak geçilir; aksi halde
  // SiteFooter/SiteHeader prop varlığında client fetch'i atladığı için logo gelmezdi.
  const data = await getNavData();
  if (!nav) nav = data.navLinks;
  if (!cols) cols = data.footerColumns;
  const logos = data.logo;
  const headerLogo = data.headerLogo;

  return (
    <>
      <SiteHeader navLinks={nav} logos={logos} headerLogo={headerLogo} />
      <main>{children}</main>
      <SiteFooter footerColumns={cols} logos={logos} />
    </>
  );
}
