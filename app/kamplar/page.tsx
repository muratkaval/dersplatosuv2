import { PageContainer } from "../components/site-layout";
import CourseCard from "../components/course-card";
import { getCamps } from "@/app/lib/strapi";
import CampFilter from "@/app/components/camp-filter";

export default async function EgitimPage() {
  const camps = await getCamps();

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow">Ders Platosu</div>
          <h1>Eğitim <span>Kamplarımız</span></h1>
          <p>Alanında uzman hocalarla yeni nesil konu anlatım kamplarına katılın.</p>
        </div>
      </section>

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
