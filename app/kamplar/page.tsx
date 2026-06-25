import { PageContainer } from "../components/site-layout";
import { getCamps } from "@/app/lib/strapi";
import CampFilterableList from "@/app/components/camp-filterable-list";
import PageHero from "@/app/components/page-hero";

export default async function EgitimPage() {
  const camps = await getCamps();

  return (
    <PageContainer>
      <PageHero pageKey="kamplar" title="Kamplarımız" subtitle="Ders Platosu hocaları ile Özel Kamplara katılın." />

      <section className="courses-section" style={{ padding: "60px 0" }} id="dersler">
        <div className="container">
          <CampFilterableList camps={camps} />
        </div>
      </section>
    </PageContainer>
  );
}
