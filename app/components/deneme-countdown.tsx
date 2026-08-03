"use client";

import { useEffect, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function calcTimeLeft(targetDate: string): TimeLeft {
  const distance = new Date(targetDate).getTime() - Date.now();
  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
    expired: false,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function DenemeCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(targetDate));
  const [mounted, setMounted] = useState(false);

  // Sunucu ile istemci saati farklı olacağı için ilk render'da hiçbir şey basma.
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) return null;

  if (timeLeft.expired) {
    return <div className="deneme-countdown-started">Sınav başladı</div>;
  }

  const units = [
    { value: String(timeLeft.days), label: "Gün" },
    { value: pad(timeLeft.hours), label: "Saat" },
    { value: pad(timeLeft.minutes), label: "Dakika" },
    { value: pad(timeLeft.seconds), label: "Saniye" },
  ];

  return (
    <div className="deneme-countdown" role="timer" aria-label="Sınava kalan süre">
      {units.map((u) => (
        <div key={u.label} className="deneme-countdown-unit">
          <span className="deneme-countdown-value">{u.value}</span>
          <span className="deneme-countdown-label">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
