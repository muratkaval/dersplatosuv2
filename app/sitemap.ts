import type { MetadataRoute } from "next";
import { getCamps, getInstructors, getBooks, getSubjects } from "@/app/lib/strapi";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [camps, instructors, books, subjects] = await Promise.all([
    getCamps(),
    getInstructors(),
    getBooks(),
    getSubjects(),
  ]);

  const now = new Date();

  // 1. Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/kamplar`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/kitaplar`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/youtuber-hocalar`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/video-soru-cozumleri`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  // 2. Camp Detail Routes
  const campRoutes: MetadataRoute.Sitemap = camps.map((camp) => ({
    url: `${siteUrl}/kamplar/${camp.slug}`,
    lastModified: camp.updatedAt ? new Date(camp.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 3. Instructor Detail Routes
  const instructorRoutes: MetadataRoute.Sitemap = instructors.map((inst) => ({
    url: `${siteUrl}/hoca/${inst.slug}`,
    lastModified: inst.updatedAt ? new Date(inst.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // 4. Book Detail Routes
  const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${siteUrl}/kitaplar/${book.slug}`,
    lastModified: book.updatedAt ? new Date(book.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // 5. Subject / Video Solution Routes
  const videoSolutionRoutes: MetadataRoute.Sitemap = books.flatMap((book) => {
    const bookSubjects = book.subjects || [];
    return bookSubjects.map((sub: any) => ({
      url: `${siteUrl}/video-soru-cozumleri/${sub.slug || sub.id}/${book.slug}`,
      lastModified: book.updatedAt ? new Date(book.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  });

  return [
    ...staticRoutes,
    ...campRoutes,
    ...instructorRoutes,
    ...bookRoutes,
    ...videoSolutionRoutes,
  ];
}
