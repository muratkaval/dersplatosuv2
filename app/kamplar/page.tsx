import { PageContainer } from "../components/site-layout";
import CourseCard from "../components/course-card";
import { getCamps } from "@/app/lib/strapi";

export default async function EgitimPage() {
  const camps = await getCamps();

  return (
    <PageContainer>
      <section className="courses-section" style={{ paddingTop: "120px" }} id="dersler">
        <div className="container">
          <div className="section-header">
            <h1 className="section-title">Eğitim Kampları</h1>
            <p className="section-desc">Platformumuzdaki tüm kampları buradan inceleyebilirsiniz</p>
          </div>
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
