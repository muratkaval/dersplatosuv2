"use client";
import { useState, useRef } from "react";

interface BookVideoHeroProps {
  promoVideo: string;       // YouTube URL or video ID
  accentColor?: string;
  coverUrl: string;
  title: string;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // Already an ID (11 chars, no slashes)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function BookVideoHero({ promoVideo, accentColor = "#4289F7", coverUrl, title }: BookVideoHeroProps) {
  const videoId = extractYouTubeId(promoVideo);
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!videoId) return null;

  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div className="bvh-root" ref={containerRef}>
      {/* Blurred background cinematic layer */}
      <div
        className="bvh-bg-blur"
        style={{ backgroundImage: `url(${thumbUrl})` }}
        aria-hidden="true"
      />
      <div className="bvh-bg-overlay" style={{ background: `linear-gradient(to right, rgba(5,11,31,0.92) 40%, rgba(5,11,31,0.55) 100%)` }} />

      {/* Content */}
      <div className="bvh-content">
        {/* Video Player Card */}
        <div className="bvh-player-wrap">
          {!playing ? (
            <button
              className="bvh-thumb-btn"
              onClick={() => setPlaying(true)}
              aria-label="Tanıtım videosunu oynat"
              id="play-promo-video-btn"
            >
              <img src={thumbUrl} alt={`${title} tanıtım videosu`} className="bvh-thumb-img" />
              {/* Gradient overlay on thumb */}
              <div className="bvh-thumb-overlay" style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, rgba(0,0,0,0.45) 100%)` }} />
              {/* Play button */}
              <div className="bvh-play-btn" style={{ boxShadow: `0 0 0 8px ${accentColor}33` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              {/* Watch label */}
              <div className="bvh-watch-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.8">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Tanıtım Videosunu İzle
              </div>
            </button>
          ) : (
            <div className="bvh-iframe-wrap">
              <iframe
                src={embedUrl}
                title={`${title} Tanıtım Videosu`}
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                className="bvh-iframe"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
