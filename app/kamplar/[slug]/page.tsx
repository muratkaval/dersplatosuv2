import { notFound } from "next/navigation";
import { PageContainer } from "../../components/site-layout";
import { getCampBySlug, toMediaUrl } from "@/app/lib/strapi";
import "./kamplar.css";
import CampView from "./camp-view";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const camp = await getCampBySlug(slug);
  
  if (!camp) return { title: "Kamp Bulunamadı | Ders Platosu" };

  return {
    title: `${camp.title} | Ders Platosu`,
    description: `${camp.title} kampı dersleri, kitapları ve detayları. Ücretsiz YT eğitim kampı içeriklerine hemen erişin.`,
    openGraph: {
      images: camp.cover?.url ? [toMediaUrl(camp.cover.url)] : [],
    }
  };
}

export default async function EgitimDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const camp = await getCampBySlug(slug);

  if (!camp) {
    notFound();
  }

  return (
    <PageContainer>
      <CampView camp={camp} />
    </PageContainer>
  );
}
