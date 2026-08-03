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

// Ana sayfa hero vitrini slaytı (snapshot). image bir medya URL'i (mutlak/göreli) ya da harici link.
export type HeroSlide = {
  kind?: "Kamp" | "Kitap" | "Öğretmen" | "Program" | "Özel";
  // Sol içerik
  eyebrow?: string;       // .hero-badge pill (boşsa global site.heroBadge'e düşer)
  title: string;          // gradient parse (<...> + \n)
  description?: string;   // .hero-desc
  btn1Text?: string;
  btn1Link?: string;
  btn2Text?: string;
  btn2Link?: string;
  // Sağ kart
  refId?: string;         // entity referansı (documentId) -> kapak CANLI çözülür (resolveHeroSlides)
  rotateAll?: boolean;    // tür seçili ama belirli öğe yok -> o türün TÜMÜ sırayla (render'da açılır)
  cardTitle?: string;     // sağ kart başlığı = içeriğin ADI (render'da canlı set edilir)
  image: string;          // snapshot/yedek kapak (Özel slaytta elle girilir)
  imageOverride?: boolean; // bağlı kartta (refId) kapağı içeriğin CANLI görseli yerine elle yüklenenle değiştir
  imageLink?: string;     // kart tıklama hedefi (yoksa btn1Link -> link)
  subtitle?: string;      // kart altı küçük satır
  badge?: string;         // kart köşe rozeti
  link: string;           // legacy/son fallback
};

// Admin "Hero Vitrini" editöründe bir kamp/kitap/program seçilince slaytı ön-doldurur.
export function slideFromEntity(kind: "Kamp" | "Kitap" | "Öğretmen" | "Program", e: any): HeroSlide {
  const make = (title: string, link: string, image: string, subtitle: string): HeroSlide => ({
    kind,
    eyebrow: kind,
    title,
    description: subtitle || "",
    btn1Text: "İncele",
    btn1Link: link,
    btn2Text: "",
    btn2Link: "",
    image,
    imageLink: link,
    subtitle,
    badge: kind,
    link,
  });
  if (kind === "Kamp") return make(e?.title || "", e?.slug ? `/kamplar/${e.slug}` : "/kamplar", getCampThumbnail(e), e?.subject?.name || "");
  if (kind === "Kitap") return make(e?.title || "", e?.slug ? `/kitaplar/${e.slug}` : (e?.buy_link || "/kitaplar"), toMediaUrl(e?.cover?.url), "");
  if (kind === "Öğretmen") return make(e?.name || "", e?.slug ? `/hoca/${e.slug}` : "/youtuber-hocalar", toMediaUrl(e?.photo?.url || e?.photo?.formats?.thumbnail?.url), e?.subjects?.[0]?.name || "Öğretmen");
  return make(e?.title || "", e?.slug ? `/programlar/${e.slug}` : "/programlar", toMediaUrl(e?.cover?.url), e?.examType || "");
}

// Entity-bağlı slaytların KAPAĞINI canlı çözer (snapshot yerine içeriğin güncel kapağı).
// Yalnız referans verilen türler için ilgili listeyi çeker (fetch'ler zaten cache'li).
export async function resolveHeroSlides(slides: HeroSlide[]): Promise<HeroSlide[]> {
  if (!Array.isArray(slides) || slides.length === 0) return [];
  // refId (tek öğe) ya da rotateAll (tüm tür) olan slaytlar için ilgili listeyi çek.
  const need = new Set(
    slides.filter((s) => (s.refId || s.rotateAll) && s.kind && s.kind !== "Özel").map((s) => s.kind)
  );
  if (need.size === 0) return slides;
  const [camps, books, programs, instructors] = await Promise.all([
    need.has("Kamp") ? getCamps() : Promise.resolve([] as any[]),
    need.has("Kitap") ? getBooks() : Promise.resolve([] as any[]),
    need.has("Program") ? getPrograms() : Promise.resolve([] as any[]),
    need.has("Öğretmen") ? getInstructors() : Promise.resolve([] as any[]),
  ]);
  const listFor = (kind?: string): any[] =>
    kind === "Kamp" ? camps : kind === "Kitap" ? books : kind === "Program" ? programs : kind === "Öğretmen" ? instructors : [];

  const out: HeroSlide[] = [];
  for (const s of slides) {
    const k = s.kind as "Kamp" | "Kitap" | "Öğretmen" | "Program";
    if (s.rotateAll && s.kind && s.kind !== "Özel") {
      // Tür slaytını o türün HER öğesi için bir slayta aç (sol içerik korunur, sağ kart = öğe).
      for (const ent of listFor(s.kind)) {
        const live = slideFromEntity(k, ent);
        if (!live.image && !live.title) continue;
        out.push({
          ...s,
          rotateAll: false,
          refId: String(ent.documentId || ent.id),
          image: live.image,
          imageLink: s.imageLink || live.link,
          link: live.link,
          cardTitle: live.title,    // kart başlığı = öğenin ADI
          subtitle: live.subtitle,  // alt yazı = branş/kategori
          badge: s.badge || live.badge,
        });
      }
    } else if (s.refId && s.kind && s.kind !== "Özel") {
      const ent = listFor(s.kind).find((e) => String(e.documentId) === s.refId || String(e.id) === s.refId);
      if (ent) {
        const live = slideFromEntity(k, ent);
        // Görsel: elle "kapak override" yüklenmişse onu kullan; yoksa içeriğin CANLI kapağı.
        const cover = s.imageOverride && s.image ? s.image : (live.image || s.image);
        out.push({ ...s, image: cover, cardTitle: live.title });
      } else {
        out.push(s);
      }
    } else {
      out.push(s);
    }
  }
  return out;
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
  examTypes?: string[];
  netMin?: number;
  netMax?: number;
  periodType?: string;
  durationCount?: number;
  videoUrl?: string;
  buyUrl?: string;
  buyButtonText?: string;
  buyButtonIcon?: string;
  description?: string;
  cover?: { url?: string } | null;
  downloadPdf?: { url?: string } | null;
  subjects?: Array<{ id?: number; name?: string; slug?: string }>;
  weeks?: ProgramWeek[];
  books?: Book[];
  instructors?: Instructor[];
  subOptions?: string[];
  displayOrder?: number;
  updatedAt?: string;
};

// "Haftalık"/"Günlük"/"Aylık" -> birim kelimesi. Kart, detay ve admin formu ortak kullanır.
export function periodUnitWord(periodType?: string): string {
  return periodType === "Günlük" ? "Gün" : periodType === "Aylık" ? "Ay" : "Hafta";
}

// İlan edilen süre: elle girilen durationCount > 0 ise o, yoksa içerik (weeks) satır sayısı.
// Tüm haftalar tek dosyaya konunca satır sayısı 1 olur; o zaman durationCount devreye girer.
export function programDurationCount(p: Pick<Program, "durationCount" | "weeks">): number {
  return typeof p.durationCount === "number" && p.durationCount > 0
    ? p.durationCount
    : p.weeks?.length || 0;
}

// Bir programın ait olduğu ana kategoriler. Çoklu examTypes varsa o, yoksa
// geriye dönük tekil examType. Filtre/kart/detay/admin ortak kullanır.
export function programCategories(p: Pick<Program, "examType" | "examTypes">): string[] {
  if (Array.isArray(p.examTypes) && p.examTypes.length) return p.examTypes.filter(Boolean);
  return p.examType ? [p.examType] : [];
}

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
  const [data, allBooks, allInstructors] = await Promise.all([
    fetchWithFallback<{ data: any[] }>([
      // Primary: full populate + the program's selected books/instructors (ids
      // only; covers/photos come from the merge below). Falls back to a lean
      // query so the page still renders if a relation ever errors.
      `/programs?filters[slug][$eq]=${slug}&${PROGRAM_POPULATE}&populate[books]=true&populate[instructors]=true`,
      `/programs?filters[slug][$eq]=${slug}&${PROGRAM_POPULATE}`,
      `/programs?filters[slug][$eq]=${slug}&populate=*`,
    ]),
    getBooks(),
    getInstructors(),
  ]);
  const raw = flattenStrapi(data?.data?.[0] || null);
  if (!raw) return null;
  // Merge selected books/instructors with full data (cover, links, photo) like getCampBySlug.
  const mergedBooks = (raw.books || [])
    .map((rb: any) => allBooks.find((b) => b.id === rb.id || b.documentId === rb.documentId) || rb)
    .filter(Boolean);
  const mergedInstructors = (raw.instructors || [])
    .map((ri: any) => allInstructors.find((i) => i.id === ri.id || i.documentId === ri.documentId) || ri)
    .filter(Boolean);
  return {
    ...raw,
    slug: raw.slug || slugify(raw.title),
    books: mergedBooks,
    instructors: mergedInstructors,
  };
}

export type FaqItem = { q: string; a: string };

export type Exam = {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  subtitle?: string;
  btn1Text?: string;
  btn1Link?: string;
  btn2Text?: string;
  btn2Link?: string;
  mediaType?: "video" | "image";
  videoUrl?: string;
  cover?: { url?: string } | null;
  description?: string;
  faq?: FaqItem[];
  examDate?: string;
  enabled?: boolean;
  displayOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt?: string;
};

// Program'daki ile aynı gerekçe: Strapi v5 tekil medyada `populate[cover]=*`
// isteğini reddediyor (polymorphic `related` -> 400). Alan başına `=true` kullan.
const EXAM_POPULATE = "populate[cover]=true";

// faq alanı json; Strapi'den dizi yerine string ya da bozuk kayıt gelirse
// sayfayı düşürmemek için normalize et.
function normalizeFaq(raw: any): FaqItem[] {
  let list = raw;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((item: any) => ({ q: String(item?.q || "").trim(), a: String(item?.a || "").trim() }))
    .filter((item) => item.q);
}

function mapExam(raw: any): Exam {
  return {
    ...raw,
    slug: raw.slug || slugify(raw.title),
    faq: normalizeFaq(raw.faq),
  };
}

export async function getExams(): Promise<Exam[]> {
  const data = await fetchWithFallback<{ data: any[] }>([
    `/exams?filters[enabled][$eq]=true&${EXAM_POPULATE}&sort[0]=displayOrder:asc&sort[1]=createdAt:desc&pagination[pageSize]=100`,
    `/exams?${EXAM_POPULATE}&sort[0]=displayOrder:asc&pagination[pageSize]=100`,
    "/exams?populate=*&pagination[pageSize]=100",
  ]);
  const items = flattenStrapi(data?.data || []);
  // Filtreli sorgu düşüp fallback'e inilirse yayında olmayanlar da gelir; burada ele.
  return items.map(mapExam).filter((e: Exam) => e.enabled !== false);
}

export async function getExamBySlug(slug: string): Promise<Exam | null> {
  const data = await fetchWithFallback<{ data: any[] }>([
    `/exams?filters[slug][$eq]=${slug}&${EXAM_POPULATE}`,
    `/exams?filters[slug][$eq]=${slug}&populate=*`,
  ]);
  const raw = flattenStrapi(data?.data?.[0] || null);
  if (!raw) return null;
  return mapExam(raw);
}

export async function getProgramsByInstructor(instructorId: string | number, documentId?: string): Promise<Program[]> {
  // Must explicitly populate instructors — PROGRAM_POPULATE does not include them
  const data = await fetchWithFallback<{ data: any[] }>([
    `/programs?${PROGRAM_POPULATE}&populate[instructors]=true&sort[0]=displayOrder:asc&pagination[pageSize]=100`,
    `/programs?populate=*&sort[0]=displayOrder:asc&pagination[pageSize]=100`,
  ]);
  const items = flattenStrapi(data?.data || []);
  const programs: Program[] = items.map((item: any) => ({ ...item, slug: item.slug || slugify(item.title) }));

  return programs.filter((p: any) => {
    const instructors: any[] = Array.isArray(p.instructors) ? p.instructors : (p.instructors?.data || []);
    return instructors.some((i: any) => {
      if (documentId && i.documentId && i.documentId === documentId) return true;
      return String(i.id) === String(instructorId);
    });
  });
}

