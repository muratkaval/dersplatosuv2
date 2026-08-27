import { getGlobalSettings } from "@/app/lib/strapi";

export default async function PageHero({
  pageKey,
  title,
  highlight = "",
  subtitle,
  className = "",
}: {
  pageKey: string;
  title: string;
  highlight?: string;
  subtitle: string;
  /** Sayfaya ozel hero davranisi icin ek sinif. */
  className?: string;
}) {
  let h: any = {};
  try {
    const s = await getGlobalSettings();
    const settings = s?.attributes || s || {};
    h = settings.pageHeaders?.[pageKey] || {};
  } catch {
    h = {};
  }

  const t = h.title ?? title;
  const hl = h.highlight ?? highlight;
  const sub = h.subtitle ?? subtitle;

  return (
    <section className={`page-hero${className ? ` ${className}` : ""}`}>
      <div className="page-hero-inner">
        <h1>
          {t}
          {hl ? (
            <>
              {" "}
              <span>{hl}</span>
            </>
          ) : null}
        </h1>
        {sub && <p>{sub}</p>}
      </div>
    </section>
  );
}
