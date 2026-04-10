import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";
const strapiBase = (process.env.STRAPI_URL || "http://localhost:1340").replace(/\/api\/?$/, "");
const strapiToken = process.env.STRAPI_TOKEN || "";
const headers = strapiToken ? { Authorization: `Bearer ${strapiToken}` } : undefined;

async function fetchSlugs(endpoint: string): Promise<{ slug: string; updatedAt: string }[]> {
  try {
    const res = await fetch(
      `${strapiBase}/api/${endpoint}?pagination[pageSize]=500&fields[0]=slug&fields[1]=updatedAt`,
      { headers, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).flatMap((item: any) => {
      const slug = item.slug || item.attributes?.slug;
      const updatedAt = item.updatedAt || item.attributes?.updatedAt || new Date().toISOString();
      return slug ? [{ slug, updatedAt }] : [];
    });
  } catch {
    return [];
  }
}

function toEntries(
  items: { slug: string; updatedAt: string }[],
  pathPrefix: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly"
): MetadataRoute.Sitemap {
  return items.map(({ slug, updatedAt }) => ({
    url: `${siteUrl}/${pathPrefix}/${slug}`,
    lastModified: new Date(updatedAt),
    changeFrequency,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [camps, books, instructors] = await Promise.all([
    fetchSlugs("camps"),
    fetchSlugs("books"),
    fetchSlugs("instructors"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/kamplar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/kitaplar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/youtuber-hocalar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/video-soru-cozumleri`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    // Static CMS pages
    { url: `${siteUrl}/hakkimizda`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/gizlilik-ve-cerez-politikasi`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/kullanim-kosullari`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  return [
    ...staticRoutes,
    ...toEntries(camps, "kamplar", 0.85, "weekly"),
    ...toEntries(books, "kitaplar", 0.90, "weekly"),   // kitaplar en yüksek priority
    ...toEntries(instructors, "hoca", 0.80, "monthly"),
  ];
}
