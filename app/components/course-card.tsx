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
      <div className="course-thumb" style={{ aspectRatio: "16 / 9", height: "auto" }}>
        <img 
          src={thumbnail} 
          alt={camp.title} 
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} 
        />
        <div className="play-overlay">
          <div className="play-button-circle">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="course-body" style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <h3 style={{ marginBottom: "8px", fontSize: "1.1rem", lineHeight: "1.4" }}>
          {camp.title}
        </h3>
        
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "auto", paddingBottom: "16px" }}>
          {lessonsCount} ders içeriyor
        </div>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          paddingTop: "16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          marginTop: "auto"
        }}>
          {hasMultipleInstructors ? (
            <>
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
              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>Tümü</span>
            </>
          ) : (
            <>
              {firstInstructor ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {(() => {
                    const pUrl = toMediaUrl(firstInstructor.photo?.url || firstInstructor.photo?.formats?.thumbnail?.url);
                    return pUrl ? (
                      <img 
                        src={pUrl} 
                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }} 
                        alt={firstInstructor.name}
                      />
                    ) : (
                      <div 
                        style={{ 
                          width: "32px", height: "32px", borderRadius: "50%", 
                          background: "var(--bg-secondary)", border: "2px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" 
                        }}
                      >
                         👤
                      </div>
                    );
                  })()}
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>
                    {firstInstructor.name}
                  </span>
                </div>
              ) : (
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>Eğitmen Yok</span>
              )}
              <span 
                className="course-tag" 
                style={{ 
                  position: "static", 
                  marginBottom: 0, 
                  fontSize: "0.75rem",
                  padding: "4px 10px" 
                }}
              >
                {camp.subject?.name || "Kamp"}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

