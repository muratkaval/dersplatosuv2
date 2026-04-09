const rawBase = process.env.STRAPI_URL || "http://localhost:1340";
const strapiOrigin = rawBase.replace(/\/api\/?$/, "");
const strapiApiBase = `${strapiOrigin}/api`;

const token = process.env.STRAPI_TOKEN || "";

function buildHeaders(): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function toMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (!url.startsWith("/")) return `${strapiOrigin}/${url}`;
  return `${strapiOrigin}${url}`;
}

export function getCampThumbnail(camp: any): string {
  if (camp?.cover?.url) return toMediaUrl(camp.cover.url);
  
  const extractId = (url?: string) => {
    if (!url) return '';
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    const match2 = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed|v)\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (match2) return match2[1];
    const match3 = url.match(/([a-zA-Z0-9_-]{11})/);
    return match3 ? match3[1] : '';
  };

  const videoId = extractId(camp?.introVideo) || extractId(camp?.playlist);
  if (videoId && videoId.length === 11) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return 'https://via.placeholder.com/640x360?text=KAMP';
}

export type Camp = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  introVideo?: string;
  playlist?: string;
  subject?: { name?: string } | null;
  cover?: { url?: string } | null;
  instructors?: Array<{
    id: number;
    name: string;
    photo?: { url?: string; formats?: { thumbnail?: { url?: string } } } | null;
  }>;
};

export type Instructor = {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  youtube?: string;
  instagram?: string;
  photo?: { url?: string; formats?: { thumbnail?: { url?: string } } } | null;
  subjects?: Array<{ name?: string }>;
};

export type Book = {
  id: number;
  documentId?: string;
  title: string;
  featured?: boolean;
  buy_link?: string;
  solution_link?: string;
  cover?: { url?: string } | null;
  subjects?: Array<{ name?: string }>;
};

async function fetchStrapi<T>(pathAndQuery: string): Promise<T | null> {
  try {
    const res = await fetch(`${strapiApiBase}${pathAndQuery}`, {
      headers: buildHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchWithFallback<T>(queries: string[]): Promise<T | null> {
  for (const q of queries) {
    const data = await fetchStrapi<T>(q);
    if (data) return data;
  }
  return null;
}

function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function flattenStrapi(data: any): any {
  if (Array.isArray(data)) {
    return data.map(flattenStrapi);
  }

  if (data && typeof data === "object") {
    // If it's a wrapper object containing "data"
    if (data.data) {
      if (Array.isArray(data.data)) {
        return data.data.map(flattenStrapi);
      }
      return flattenStrapi(data.data);
    }

    // If it has "attributes"
    if (data.attributes) {
      const flattened = { id: data.id, documentId: data.documentId, ...data.attributes };
      for (const key in flattened) {
        flattened[key] = flattenStrapi(flattened[key]);
      }
      return flattened;
    }

    // Otherwise recurse through the object's keys
    const flattened = { ...data };
    for (const key in flattened) {
      flattened[key] = flattenStrapi(flattened[key]);
    }
    return flattened;
  }

  return data;
}

export async function getCamps(): Promise<Camp[]> {
  const data = await fetchWithFallback<{ data: any[] }>([
    "/camps?populate[categories]=*&populate[lessons]=*&populate[instructors][populate][0]=photo&populate[cover]=*&populate[subject]=*&populate[books][populate][0]=cover&sort[0]=createdAt:desc&pagination[pageSize]=100",
    "/camps?populate=*&sort[0]=createdAt:desc&pagination[pageSize]=100",
    "/camps?pagination[pageSize]=100"
  ]);

  const items = flattenStrapi(data?.data || []);
  return items.map((item: any) => ({
    ...item,
    slug: item.slug || slugify(item.title)
  }));
}

export async function getCampBySlug(slug: string): Promise<any | null> {
  const allCamps = await getCamps();
  const found = allCamps.find((c) => c.slug === slug);
  if (!found) return null;

  // Fetch full details using its documentId or id to be safe against missing slug fields on direct endpoints
  const details = await fetchWithFallback<{ data: any[] }>([
    `/camps?filters[documentId][$eq]=${found.documentId || ''}&populate[categories]=*&populate[lessons]=*&populate[instructors][populate][0]=photo&populate[cover]=*&populate[subject]=*&populate[books][populate][0]=cover`,
    `/camps?filters[id][$eq]=${found.id}&populate[categories]=*&populate[lessons]=*&populate[instructors][populate][0]=photo&populate[cover]=*&populate[subject]=*&populate[books][populate][0]=cover`,
    `/camps?filters[id][$eq]=${found.id}&populate=*`
  ]);

  const rawItem = details?.data?.[0] || found;
  const item = flattenStrapi(rawItem);
  item.slug = item.slug || slugify(item.title);
  return item;
}

export async function getInstructors(): Promise<Instructor[]> {
  const data = await fetchWithFallback<{ data: any[] }>([
    "/instructors?populate[photo]=*&populate[subjects]=*&populate[camps][populate][0]=cover&sort[0]=displayOrder:asc&pagination[pageSize]=100",
    "/instructors?populate=*&sort[0]=displayOrder:asc&pagination[pageSize]=100",
    "/instructors?pagination[pageSize]=100"
  ]);

  const items = flattenStrapi(data?.data || []);
  return items.map((item: any) => ({
    ...item,
    slug: item.slug || slugify(item.name)
  }));
}

export async function getInstructorBySlug(slug: string): Promise<any | null> {
  const allInstructors = await getInstructors();
  const found = allInstructors.find((i) => i.slug === slug);
  if (!found) return null;

  const details = await fetchWithFallback<{ data: any[] }>([
    `/instructors?filters[documentId][$eq]=${found.documentId || ''}&populate[photo]=*&populate[subjects]=*&populate[camps][populate][0]=cover`,
    `/instructors?filters[id][$eq]=${found.id}&populate[photo]=*&populate[subjects]=*&populate[camps][populate][0]=cover`,
    `/instructors?filters[id][$eq]=${found.id}&populate=*`
  ]);

  const rawItem = details?.data?.[0] || found;
  const item = flattenStrapi(rawItem);
  item.slug = item.slug || slugify(item.name);
  return item;
}

export async function getBooks(featuredOnly = false): Promise<Book[]> {
  const featuredFilter = featuredOnly ? "&filters[featured][$eq]=true" : "";
  const data = await fetchWithFallback<{ data: any[] }>([
    `/books?populate=*&sort[0]=createdAt:desc&pagination[pageSize]=100${featuredFilter}`,
    `/books?pagination[pageSize]=100${featuredFilter}`
  ]);

  const items = flattenStrapi(data?.data || []);
  return items.map((item: any) => ({
    ...item,
    slug: item.slug || slugify(item.title)
  }));
}

export async function getSubjects(): Promise<any[]> {
  const data = await fetchWithFallback<{ data: any[] }>([
    `/subjects?populate=*&sort[0]=displayOrder:asc&sort[1]=name:asc&pagination[pageSize]=100`,
    `/subjects?sort=name:asc&pagination[pageSize]=100`
  ]);

  const items = flattenStrapi(data?.data || []);
  return items.map((item: any) => ({
    ...item,
    slug: item.slug || slugify(item.name)
  }));
}
