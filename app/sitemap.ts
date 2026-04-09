import type { MetadataRoute } from "next";

type StrapiCamp = {
  slug?: string;
  attributes?: {
    slug?: string;
    updatedAt?: string;
  };
  updatedAt?: string;
};

type StrapiListResponse<T> = {
  data?: T[];
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";

async function getCampEntries(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.STRAPI_URL || "http://localhost:1340";
  const token = process.env.STRAPI_TOKEN || "";
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const url = `${baseUrl}/api/camps?pagination[pageSize]=500&fields[0]=slug&fields[1]=updatedAt`;

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const json = (await res.json()) as StrapiListResponse<StrapiCamp>;
    const camps = Array.isArray(json.data) ? json.data : [];

    return camps.flatMap((camp) => {
      const slug = camp.slug || camp.attributes?.slug;
      if (!slug) return [];

      const updatedAtRaw = camp.updatedAt || camp.attributes?.updatedAt;
      const lastModified = updatedAtRaw ? new Date(updatedAtRaw) : new Date();

      return [
        {
          url: `${siteUrl}/kamplar/${slug}`,
          lastModified,
          changeFrequency: "daily" as const,
          priority: 0.8,
        },
      ];
    });
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/kamplar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/kitaplar`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/youtuber-hocalar`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/video-soru-cozumleri`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const campRoutes = await getCampEntries();
  return [...staticRoutes, ...campRoutes];
}

