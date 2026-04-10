"use client";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Book3DProps {
  coverUrl: string;
  title: string;
  accentColor?: string;
}

export default function Book3D({ coverUrl, title, accentColor = "#4289F7" }: Book3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), springConfig);

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <div className="book-3d-scene" ref={ref} onMouseMove={handleMouse} onMouseLeave={handleMouseLeave} onMouseEnter={() => setIsHovered(true)}>
      <motion.div
        className="book-3d-wrapper"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {/* Book Front Cover */}
        <div className="book-3d-front">
          <img src={coverUrl} alt={title} className="book-3d-cover-img" />
          {/* Shine overlay */}
          <motion.div
            className="book-3d-shine"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Book Spine */}
        <div className="book-3d-spine" style={{ background: accentColor }}>
          <span>{title}</span>
        </div>

        {/* Book Pages Edge */}
        <div className="book-3d-pages" />

        {/* Glow effect */}
        <motion.div
          className="book-3d-glow"
          style={{ background: `radial-gradient(ellipse at center, ${accentColor}55 0%, transparent 70%)` }}
          animate={{ opacity: isHovered ? 1 : 0.4, scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    </div>
  );
}
