"use client";

import { useState, useEffect } from "react";

interface StickyCTAProps {
  title: string;
  coverUrl: string;
  buyLink?: string;
  previewLink?: string;
  accentColor: string;
}

export default function BookStickyCTA({ title, coverUrl, buyLink, previewLink, accentColor }: StickyCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 600px
      if (window.scrollY > 600) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`mobile-sticky-cta ${visible ? "visible" : ""}`} style={{ "--accent-color": accentColor } as any}>
      <div className="mobile-cta-inner">
        <div className="sticky-book-info">
          <img src={coverUrl} alt={title} className="sticky-book-thumb" />
          <div className="sticky-book-text">
            <p className="sticky-book-title">{title}</p>
            <span className="sticky-book-price">Yeni Nesil Soru Bankası</span>
          </div>
        </div>
        
        <div className="sticky-actions">
           <a 
            href={previewLink || "#flipbook-section"} 
            className="btn-sticky btn-sticky-secondary"
          >
            İncele
          </a>
          <a 
            href={buyLink || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-sticky btn-sticky-primary"
          >
            Satın Al
          </a>
        </div>
      </div>
    </div>
  );
}
