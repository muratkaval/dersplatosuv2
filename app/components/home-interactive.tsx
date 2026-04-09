"use client";

import { useEffect, useMemo, useState } from "react";

type HeroCamp = {
  title: string;
  subject: string;
  coverUrl: string;
  slug: string;
};

type InstructorCard = {
  name: string;
  subject: string;
  photoUrl: string;
  youtube: string;
  instagram: string;
};

export function HomeHeroSlider({ camps }: { camps: HeroCamp[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (camps.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % camps.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [camps.length]);

  const active = camps[index];

  if (!active) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-white/65">
        Strapi baglandiginda kamp onizlemesi burada gorunecek.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111833] p-4 shadow-2xl shadow-[#00000066]">
      <a href={active.slug ? `/kamplar/${active.slug}` : "/kamplar"}>
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/30">
          {active.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.coverUrl} alt={active.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/50">Kapak gorseli yok</div>
          )}
        </div>
        <h3 className="mt-4 text-lg font-semibold">{active.title}</h3>
        <p className="mt-1 text-sm text-white/70">{active.subject || "TYT - AYT"}</p>
      </a>

      {camps.length > 1 ? (
        <div className="mt-4 flex items-center gap-2">
          {camps.map((camp, i) => (
            <button
              key={`${camp.slug}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-[#7aa2ff]" : "w-2 bg-white/35"}`}
              aria-label={`Kamp ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function InstructorShowcase({ instructors }: { instructors: InstructorCard[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const active = useMemo(() => {
    if (openIndex === null) return null;
    return instructors[openIndex] || null;
  }, [openIndex, instructors]);

  if (instructors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 p-5 text-white/65">
        Hoca kayitlari henuz eklenmedi.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {instructors.map((instructor, index) => (
          <button
            type="button"
            key={`${instructor.name}-${index}`}
            onClick={() => setOpenIndex(index)}
            className="rounded-xl border border-white/10 bg-[#111833] p-3 text-left"
          >
            <div className="mx-auto h-16 w-16 overflow-hidden rounded-full border border-white/20 bg-[#1c2442]">
              {instructor.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={instructor.photoUrl} alt={instructor.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <h3 className="mt-3 line-clamp-1 text-center text-sm font-semibold">{instructor.name}</h3>
            <p className="mt-1 line-clamp-1 text-center text-xs text-white/60">{instructor.subject || "Ogretmen"}</p>
          </button>
        ))}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpenIndex(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111833] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{active.name}</h3>
              <button type="button" onClick={() => setOpenIndex(null)} className="text-white/70 hover:text-white">Kapat</button>
            </div>
            <p className="mt-1 text-sm text-white/65">{active.subject || "Ogretmen"}</p>
            <div className="mt-4 h-36 overflow-hidden rounded-xl bg-[#1c2442]">
              {active.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.photoUrl} alt={active.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {active.youtube ? (
                <a href={active.youtube} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#3f66ff] px-3 py-2 text-xs font-semibold">
                  YouTube
                </a>
              ) : null}
              {active.instagram ? (
                <a href={active.instagram} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold">
                  Instagram
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

