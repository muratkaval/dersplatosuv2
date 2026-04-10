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

async function fetchBooksWithSubjects(): Promise<{ slug: string; updatedAt: string; subjectSlug?: string }[]> {
  try {
    const res = await fetch(
      `${strapiBase}/api/books?pagination[pageSize]=500&fields[0]=slug&fields[1]=updatedAt&populate[subjects][fields][0]=slug`,
      { headers, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).flatMap((item: any) => {
      const slug = item.slug || item.attributes?.slug;
      const updatedAt = item.updatedAt || item.attributes?.updatedAt || new Date().toISOString();
      const subjects = item.subjects || item.attributes?.subjects?.data || [];
      const subjectSlug = subjects.length > 0 ? (subjects[0].slug || subjects[0].attributes?.slug) : undefined;
      return slug ? [{ slug, updatedAt, subjectSlug }] : [];
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
  const [camps, booksWithSubjects, instructors, pages] = await Promise.all([
    fetchSlugs("camps"),
    fetchBooksWithSubjects(),
    fetchSlugs("instructors"),
    fetchSlugs("pages"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/kamplar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/kitaplar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/youtuber-hocalar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/video-soru-cozumleri`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  const bookRoutes = toEntries(booksWithSubjects, "kitaplar", 0.90, "weekly");
  const campRoutes = toEntries(camps, "kamplar", 0.85, "weekly");
  const instructorRoutes = toEntries(instructors, "hoca", 0.80, "monthly");
  const pageRoutes = toEntries(pages, "sayfa", 0.5, "monthly"); // or map it to `/` if your pages exist at root

  // Generate Video Solutions Routes dynamically
  const videoSolutionRoutes: MetadataRoute.Sitemap = booksWithSubjects
    .filter(b => b.subjectSlug)
    .map(b => ({
      url: `${siteUrl}/video-soru-cozumleri/${b.subjectSlug}/${b.slug}`,
      lastModified: new Date(b.updatedAt),
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  return [
    ...staticRoutes,
    ...campRoutes,
    ...bookRoutes,   // kitaplar en yüksek priority
    ...instructorRoutes,
    ...videoSolutionRoutes,
    ...pageRoutes,
  ];
}
