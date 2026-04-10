import { notFound } from "next/navigation";
import { PageContainer } from "../../components/site-layout";
import { getCampBySlug, toMediaUrl } from "@/app/lib/strapi";
import "./kamplar.css";
import CampView from "./camp-view";
import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dersplatosu.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const camp = await getCampBySlug(slug);
  
  if (!camp) return { title: "Kamp Bulunamadı | Ders Platosu" };

  const coverUrl = camp.cover?.url ? toMediaUrl(camp.cover.url) : undefined;
  const instructors = camp.instructors || [];
  const instructorStr = instructors.map((i: any) => i.name).filter(Boolean).join(", ");
  const subject = camp.subject?.name || "YKS";

  const title = `${camp.title} – Ücretsiz ${subject} Kampı | Ders Platosu`;
  const description = `${camp.title}${instructorStr ? ` | ${instructorStr}` : ""} – Tüm ders videoları, kitaplar ve kaynaklarla ücretsiz ${subject} kampı. TYT-AYT hazırlığında en iyi kamp programı.`;
  
  const keywords = [
    camp.title,
    `${subject} kampı`,
    `ücretsiz ${subject}`,
    "TYT kamp",
    "AYT kamp",
    "YKS hazırlık",
    "Ders Platosu",
    `${camp.title} izle`,
    instructorStr,
  ];

  return {
    title,
    description,
    keywords: keywords.filter(Boolean),
    alternates: { canonical: `${siteUrl}/kamplar/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/kamplar/${slug}`,
      images: coverUrl ? [{ url: coverUrl, width: 1200, height: 630, alt: camp.title }] : [],
    },
    twitter: { card: "summary_large_image", title, description, images: coverUrl ? [coverUrl] : [] },
  };
}

export default async function EgitimDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const camp = await getCampBySlug(slug);

  if (!camp) {
    notFound();
  }

  const subjectName = camp.subject?.name || "YKS";
  const instructors = Array.isArray(camp.instructors) ? camp.instructors : (camp.instructors?.data || []);
  
  // JSON-LD: Course Schema
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": camp.title,
    "description": camp.description || `${camp.title} kampı, ücretsiz Ders Platosu eğitim platformunda.`,
    "provider": {
      "@type": "Organization",
      "name": "Ders Platosu",
      "sameAs": siteUrl
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "instructor": instructors.map((i: any) => ({
        "@type": "Person",
        "name": i.name
      }))
    },
    "offers": [{
      "@type": "Offer",
      "category": "Free",
      "price": "0",
      "priceCurrency": "TRY",
      "url": `${siteUrl}/kamplar/${slug}`,
      "availability": "https://schema.org/InStock",
    }]
  };

  return (
    <PageContainer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <CampView camp={camp} />
    </PageContainer>
  );
}
