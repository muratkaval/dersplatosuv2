const rawBase = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1340";
const strapiOrigin = rawBase.replace(/\/api\/?$/, "");
const strapiApiBase = `${strapiOrigin}/api`;

const token = process.env.STRAPI_TOKEN || "";

function buildHeaders(): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function toMediaUrl(url?: any): string {
  if (!url) return "";
  
  // Robust extraction from Strapi v4/v5 structures
  let actualUrl = "";
  if (typeof url === "string") {
    actualUrl = url;
  } else if (url && typeof url === "object") {
    // Try nested data.attributes first (v4/v5 populated style)
    actualUrl = (
      url.url || 
      url.attributes?.url || 
      url.data?.attributes?.url || 
      url.data?.url || 
      ""
    );
  }
  
  if (!actualUrl || typeof actualUrl !== "string") return "";

  // If it's already an absolute URL, return it
  if (actualUrl.startsWith("http://") || actualUrl.startsWith("https://")) return actualUrl;
  if (actualUrl.startsWith("//")) return `https:${actualUrl}`;
  
  // Return relative path. This relies on Next.js Rewrites (next.config.ts) 
  // to proxy /uploads/... to the actual Strapi backend.
  return actualUrl.startsWith("/") ? actualUrl : `/${actualUrl}`;
}

export function toAbsoluteMediaUrl(url?: any): string {
  const relative = toMediaUrl(url);
  if (!relative) return "";
  if (relative.startsWith("http")) return relative;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";
  const cleanSiteUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return `${cleanSiteUrl}${relative}`;
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
  categories?: any;
  instructors?: Array<{
    id: number;
    name: string;
    photo?: { url?: string; formats?: { thumbnail?: { url?: string } } } | null;
  }>;
  updatedAt?: string;
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
  updatedAt?: string;
};

export type Subject = {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
};

export type Book = {
  id: number;
  documentId?: string;
  title: string;
  slug?: string;
  featured?: boolean;
  buy_link?: string;
  solution_link?: string;
  accent_color?: string;
  description?: string;
  faq?: Array<{ q: string; a: string }>;
  features?: any;
  show_features?: boolean;
  show_faq?: boolean;
  preview_link?: string;
  cover?: { url?: string } | null;
  demo_pdf?: { url?: string } | null;
  subjects?: Subject[];
  instructors?: Array<{ id: number; name: string; photo?: { url?: string }; slug?: string }>;
  camps?: Array<{ id: number; title: string; slug: string; instructors?: Array<{ id: number; name: string; photo?: { url?: string }; slug?: string }>; cover?: { url?: string } | null }>;
  updatedAt?: string;
};

async function fetchStrapi<T>(pathAndQuery: string, options: NextFetchRequestConfig = { revalidate: 60 }): Promise<T | null> {
  try {
    const res = await fetch(`${strapiApiBase}${pathAndQuery}`, {
      headers: buildHeaders(),
      next: options,
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
  const [campsData, allInstructors] = await Promise.all([
    fetchWithFallback<{ data: any[] }>([
      "/camps?populate[categories]=*&populate[lessons]=*&populate[instructors][populate]=*&populate[cover]=*&populate[subject]=*&populate[books][populate]=*&sort[0]=createdAt:desc&pagination[pageSize]=100",
      "/camps?populate=*&sort[0]=createdAt:desc&pagination[pageSize]=100"
    ]),
    getInstructors()
  ]);

  const rawCamps = flattenStrapi(campsData?.data || []);
  
  return rawCamps.map((camp: any) => {
    // Merge instructors to ensure photos are available (Strapi v5 relation population fix)
    const mergedInstructors = (camp.instructors || []).map((ci: any) => {
      const full = allInstructors.find(i => i.id === ci.id || i.documentId === ci.documentId);
      return full || ci;
    });

    return {
      ...camp,
      instructors: mergedInstructors,
      slug: camp.slug || slugify(camp.title)
    };
  });
}

export async function getCampBySlug(slug: string): Promise<any | null> {
  const [allCamps, allInstructors, allBooks] = await Promise.all([
    getCamps(),
    getInstructors(),
    getBooks()
  ]);
  const found = allCamps.find((c) => c.slug === slug);
  if (!found) return null;

  const detailsData = await fetchWithFallback<{ data: any[] }>([
    `/camps?filters[documentId][$eq]=${found.documentId || ''}&populate[lessons]=*&populate[instructors][populate]=*&populate[cover]=*&populate[subject]=*&populate[books][populate]=*`,
    `/camps?filters[id][$eq]=${found.id}&populate[lessons]=*&populate[instructors][populate]=*&populate[cover]=*&populate[subject]=*&populate[books][populate]=*`
  ]);

  const rawCamp = flattenStrapi(detailsData?.data?.[0] || found);
  
  const mergedInstructors = (rawCamp.instructors || []).map((ci: any) => {
    const full = allInstructors.find(i => i.id === ci.id || i.documentId === ci.documentId);
    return full || ci;
  });

  const mergedBooks = (rawCamp.books || []).map((rb: any) => {
    const full = allBooks.find(b => b.id === rb.id || b.documentId === rb.documentId);
    return full || rb;
  });

  return {
    ...rawCamp,
    instructors: mergedInstructors,
    books: mergedBooks,
    slug: rawCamp.slug || slugify(rawCamp.title)
  };
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
  const [allInstructors, allBooks] = await Promise.all([
    getInstructors(),
    getBooks()
  ]);
  const found = allInstructors.find((i) => i.slug === slug);
  if (!found) return null;

  const detailsData = await fetchWithFallback<{ data: any[] }>([
    `/instructors?filters[documentId][$eq]=${found.documentId || ''}&populate=*`,
    `/instructors?filters[id][$eq]=${found.id}&populate=*`
  ]);

  const rawItem = flattenStrapi(detailsData?.data?.[0] || found);
  
  // Merge books to ensure covers are available
  const mergedBooks = (rawItem.books || []).map((rb: any) => {
    const full = allBooks.find(b => b.id === rb.id || b.documentId === rb.documentId);
    return full || rb;
  });

  // Re-map camps to ensure they have covers if not populated
  const rawCamps = rawItem.camps || [];
  // Since camps relation might also miss covers, we'd ideally fetch all camps too, 
  // but let's at least ensure we have the books covered as requested.
  
  return {
    ...rawItem,
    books: mergedBooks,
    slug: rawItem.slug || slugify(rawItem.name)
  };
}

export async function getBooks(featuredOnly = false): Promise<Book[]> {
  const featuredFilter = featuredOnly ? "&filters[featured][$eq]=true" : "";
  const data = await fetchWithFallback<{ data: any[] }>([
    `/books?populate[cover]=*&populate[demo_pdf]=*&populate[subjects]=*&populate[instructors][populate]=photo&populate[camps][populate][instructors][populate]=photo&populate[camps][populate][cover]=*&sort[0]=createdAt:desc&pagination[pageSize]=100${featuredFilter}`,
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
    `/subjects?populate=*&sort[0]=sira:asc&sort[1]=name:asc&pagination[pageSize]=100`,
    `/subjects?sort=name:asc&pagination[pageSize]=100`
  ]);

  const items = flattenStrapi(data?.data || []);
  return items.map((item: any) => ({
    ...item,
    slug: item.slug || slugify(item.name)
  }));
}

export async function getSolutionVideos(bookId: string): Promise<any[]> {
  const isNumericId = /^\d+$/.test(bookId);
  const filter = isNumericId
    ? `filters[book][id][$eq]=${bookId}`
    : `filters[book][documentId][$eq]=${bookId}`;

  const qs = [
    filter,
    'sort[0]=bolum_no:asc',
    'sort[1]=sira:asc',
    'pagination[pageSize]=200',
    'populate=*'
  ].join('&');

  const data = await fetchStrapi<{ data: any[] }>(`/solution-videos?${qs}`);
  return flattenStrapi(data?.data || []);
}

export async function getSubjectBySlug(slug: string): Promise<any | null> {
  const all = await getSubjects();
  return all.find((s: any) => (s.slug || '') === slug) || null;
}

export async function getBookBySlug(slug: string): Promise<any | null> {
  const all = await getBooks(false);
  const found = all.find((b: any) => (b.slug || '') === slug);
  if (!found) return null;

  // Fetch full detail with all relations
  const detailData = await fetchWithFallback<{ data: any[] }>([
    `/books?filters[documentId][$eq]=${found.documentId || ''}&populate[cover]=*&populate[demo_pdf]=*&populate[subjects]=*&populate[instructors][populate]=photo&populate[camps][populate][instructors][populate]=photo&populate[camps][populate][cover]=*&populate[solution_categories]=*`,
    `/books?filters[id][$eq]=${found.id}&populate=*`
  ]);

  const raw = flattenStrapi(detailData?.data?.[0] || found);
  return {
    ...raw,
    slug: raw.slug || slugify(raw.title)
  };
}

export async function getGlobalSettings(): Promise<any> {
  const data = await fetchStrapi<{ data: any }>(`/global-setting?populate=*`);
  return flattenStrapi(data?.data || null);
}

export type CountdownSession = {
  id?: number;
  sessionName?: string;
  sessionDate?: string;
  sessionTime?: string;
};

export type Countdown = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  targetDate: string;
  description?: string;
  bottomTitle?: string;
  bottomText?: string;
  sessions?: CountdownSession[];
  enabled?: boolean;
  showOnHomepage?: boolean;
  displayOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
};

export async function getCountdowns(): Promise<Countdown[]> {
  const data = await fetchWithFallback<{ data: any[] }>([
    `/countdowns?filters[enabled][$eq]=true&populate[sessions]=*&sort[0]=displayOrder:asc&pagination[pageSize]=50`,
    `/countdowns?populate=*&sort[0]=displayOrder:asc&pagination[pageSize]=50`,
  ]);
  const items = flattenStrapi(data?.data || []);
  return items.map((item: any) => ({
    ...item,
    slug: item.slug || slugify(item.title),
  }));
}

export async function getCountdownBySlug(slug: string): Promise<Countdown | null> {
  const data = await fetchWithFallback<{ data: any[] }>([
    `/countdowns?filters[slug][$eq]=${slug}&populate=*`,
    `/countdowns?filters[slug][$eq]=${slug}&populate[sessions]=*&populate[bottomText]=*`,
  ]);
  const raw = flattenStrapi(data?.data?.[0] || null);
  if (!raw) return null;
  return {
    ...raw,
    slug: raw.slug || slugify(raw.title),
  };
}

export type ProgramWeek = {
  weekNo?: number;
  title?: string;
  scheduleImage?: { url?: string } | null;
  pdf?: { url?: string } | null;
  link?: string;
};

export type Program = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  examType?: string;
  netMin?: number;
  netMax?: number;
  periodType?: string;
  videoUrl?: string;
  description?: string;
  cover?: { url?: string } | null;
  downloadPdf?: { url?: string } | null;
  subjects?: Array<{ id?: number; name?: string; slug?: string }>;
  weeks?: ProgramWeek[];
  books?: Book[];
  displayOrder?: number;
  updatedAt?: string;
};

// Strapi v5 rejects `populate[field]=*` on a specific media/relation (it tries
// to expand the media's polymorphic `related` key -> 400 ValidationError).
// Use explicit `=true` per field and populate the media nested inside the
// `weeks` component by name, otherwise week images/PDFs never load.
const PROGRAM_POPULATE =
  "populate[cover]=true&populate[downloadPdf]=true&populate[subjects]=true&populate[weeks][populate][scheduleImage]=true&populate[weeks][populate][pdf]=true";

export async function getPrograms(): Promise<Program[]> {
  const data = await fetchWithFallback<{ data: any[] }>([
    `/programs?${PROGRAM_POPULATE}&sort[0]=displayOrder:asc&sort[1]=createdAt:desc&pagination[pageSize]=100`,
    "/programs?populate=*&sort[0]=displayOrder:asc&pagination[pageSize]=100",
  ]);
  const items = flattenStrapi(data?.data || []);
  return items.map((item: any) => ({
    ...item,
    slug: item.slug || slugify(item.title),
  }));
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const [data, allBooks] = await Promise.all([
    fetchWithFallback<{ data: any[] }>([
      // Primary: full populate + the program's selected books (ids only; covers
      // come from the merge below). Falls back to a books-less query so the page
      // still renders if the books relation ever errors.
      `/programs?filters[slug][$eq]=${slug}&${PROGRAM_POPULATE}&populate[books]=true`,
      `/programs?filters[slug][$eq]=${slug}&${PROGRAM_POPULATE}`,
      `/programs?filters[slug][$eq]=${slug}&populate=*`,
    ]),
    getBooks(),
  ]);
  const raw = flattenStrapi(data?.data?.[0] || null);
  if (!raw) return null;
  // Merge selected books with full book data (cover, links, accent) like getCampBySlug.
  const mergedBooks = (raw.books || [])
    .map((rb: any) => allBooks.find((b) => b.id === rb.id || b.documentId === rb.documentId) || rb)
    .filter(Boolean);
  return {
    ...raw,
    slug: raw.slug || slugify(raw.title),
    books: mergedBooks,
  };
}
