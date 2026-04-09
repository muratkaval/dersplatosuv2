import Link from "next/link";
import { PageContainer } from "../components/site-layout";
import { getInstructors, toMediaUrl } from "@/app/lib/strapi";

export default async function YoutuberHocalarPage() {
  const instructors = await getInstructors();

  return (
    <PageContainer>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-eyebrow">Ders Platosu</div>
          <h1>Youtuber <span>Hocalarımız</span></h1>
          <p>Alanında uzman, deneyimli öğretmenlerle çalış ve başarı sağla</p>
        </div>
      </section>

      <section className="youtubers-section" id="youtubers" style={{ padding: "60px 0" }}>
        <div className="container">
          <div className="youtubers-grid grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
            {instructors.map((instructor) => (
              <Link
                key={instructor.id}
                href={`/hoca/${instructor.slug || instructor.documentId || String(instructor.id)}`}
                className="story-item"
                style={{ textDecoration: "none" }}
              >
                <div className="story-ring">
                  {instructor.photo?.url ? (
                    <img
                      src={toMediaUrl(instructor.photo?.formats?.thumbnail?.url || instructor.photo?.url) || ""}
                      alt={instructor.name}
                      className="story-img"
                    />
                  ) : (
                    <div className="story-fallback flex items-center justify-center text-3xl h-full w-full bg-slate-800 rounded-full border-4 border-[#050b1f]">👨‍🏫</div>
                  )}
                </div>
                <span className="story-name">{instructor.name}</span>
                <span className="story-subject">{instructor.subjects?.[0]?.name || "Öğretmen"}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
