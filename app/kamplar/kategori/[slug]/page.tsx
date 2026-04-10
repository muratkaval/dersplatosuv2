import { notFound } from "next/navigation";
import { PageContainer } from "@/app/components/site-layout";
import CourseCard from "@/app/components/course-card";
import CampFilter from "@/app/components/camp-filter";
import { getCamps } from "@/app/lib/strapi";

function slugify(t: string = "") {
  return t.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const camps = await getCamps();
  
  // Find the original category name matching this slug
  let categoryName = "Kategori";
  for (const camp of camps) {
    const cats = Array.isArray(camp.categories) ? camp.categories : (camp.categories?.data || []);
    for (const cat of cats) {
      const catTitle = cat.name || cat.attributes?.name || cat.title || cat.attributes?.title || "";
      if (slugify(catTitle) === slug) {
        categoryName = catTitle;
        break;
      }
    }
  }

  return {
    title: `${categoryName} Kampları | Ders Platosu`,
    description: `${categoryName} alanındaki tüm soru çözüm, konu anlatım ve tekrar detay kamplarımız.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const allCamps = await getCamps();
  
  let categoryName = "Kategori";
  
  // Filter camps by category slug
  const categoryCamps = allCamps.filter(camp => {
    const cats = Array.isArray(camp.categories) ? camp.categories : (camp.categories?.data || []);
    return cats.some((cat: any) => {
      const catTitle = cat.name || cat.attributes?.name || cat.title || cat.attributes?.title || "Sınıflandırılmamış Kamplar";
      if (slugify(catTitle) === slug) {
        categoryName = catTitle;
        return true;
      }
      return false;
    });
  });

  if (categoryCamps.length === 0) {
    notFound();
  }

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow">Kamp Kategorisi</div>
          <h1 dangerouslySetInnerHTML={{ __html: categoryName }} />
          <p>Alanında uzman hocalarla <b>{categoryName}</b> odaklı özel çalışmalarımıza katılın.</p>
        </div>
      </section>

      <section className="courses-section" style={{ padding: "60px 0" }} id="dersler">
        <div className="container">
          <CampFilter camps={allCamps} activeSlug={slug} />
          <div className="courses-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {categoryCamps.map((camp) => (
              <CourseCard key={camp.id} camp={camp} />
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
