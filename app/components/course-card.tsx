import Link from "next/link";
import { getCampThumbnail, toMediaUrl } from "@/app/lib/strapi";

export default function CourseCard({ camp }: { camp: any }) {
  const thumbnail = getCampThumbnail(camp);
  const lessonsCount = camp.lessons?.length || 0;
  const instructors = camp.instructors || [];
  
  // Eğitmenleri normalize edelim (Strapi v4/v5 farklılıkları için data objesi kontrolü)
  const normalizedInstructors = Array.isArray(instructors) ? instructors : (instructors?.data || []);
  
  const hasMultipleInstructors = normalizedInstructors.length > 1;
  const firstInstructor = normalizedInstructors[0];

  return (
    <Link href={`/kamplar/${camp.slug}`} className="course-card">
      <div className="course-thumb" style={{ aspectRatio: "16 / 9", height: "auto", position: "relative" }}>
        <img 
          src={thumbnail} 
          alt={camp.title} 
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} 
        />
      </div>
      
      <div className="course-body" style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <h3 style={{ marginBottom: "8px", fontSize: "1.1rem", lineHeight: "1.4" }}>
          {camp.title}
        </h3>
        
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "auto", paddingBottom: "16px" }}>
          {lessonsCount} ders içeriyor
        </div>

        <div className="course-footer">
          {hasMultipleInstructors ? (
            <div className="avatar-stack" style={{ margin: 0 }}>
              {normalizedInstructors.slice(0, 5).map((inst: any, idx: number) => {
                const pUrl = toMediaUrl(inst.photo?.url || inst.photo?.formats?.thumbnail?.url);
                return pUrl ? (
                  <img 
                    key={inst.id || idx}
                    src={pUrl} 
                    className="avatar-stack-img" 
                    alt={inst.name} 
                  />
                ) : (
                  <div 
                    key={inst.id || idx}
                    className="avatar-stack-img" 
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}
                  >
                     👤
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="course-instructor">
              {firstInstructor ? (
                <>
                  {(() => {
                    const pUrl = toMediaUrl(firstInstructor.photo?.url || firstInstructor.photo?.formats?.thumbnail?.url);
                    return pUrl ? (
                      <img 
                        src={pUrl} 
                        className="instructor-avatar-sm"
                        alt={firstInstructor.name}
                      />
                    ) : (
                      <div className="instructor-avatar-sm-fallback">👤</div>
                    );
                  })()}
                  <span className="instructor-name-sm">
                    {firstInstructor.name}
                  </span>
                </>
              ) : (
                <span className="instructor-name-sm">Eğitmen Yok</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
