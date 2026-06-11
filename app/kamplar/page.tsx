import { PageContainer } from "../components/site-layout";
import CourseCard from "../components/course-card";
import { getCamps } from "@/app/lib/strapi";
import CampFilter from "@/app/components/camp-filter";
import PageHero from "@/app/components/page-hero";

export default async function EgitimPage() {
  const camps = await getCamps();

  return (
    <PageContainer>
      <PageHero pageKey="kamplar" title="Kamplarımız" subtitle="Ders Platosu hocaları ile Özel Kamplara katılın." />

      <section className="courses-section" style={{ padding: "60px 0" }} id="dersler">
        <div className="container">
          <CampFilter camps={camps} />
          <div className="courses-grid">
            {camps.map((camp) => (
              <CourseCard key={camp.id} camp={camp} />
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
