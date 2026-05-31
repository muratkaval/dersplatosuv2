"use client";

import { useEffect, useState } from "react";

export default function YksCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // YKS 2026 Target Date: June 20, 2026 10:15
    const targetDate = new Date("2026-06-20T10:15:00").getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return null;

  // SVG parameters
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const getStrokeDashoffset = (value: number, max: number) => {
    return circumference - (value / max) * circumference;
  };

  const Circle = ({ value, max, label, color }: { value: number, max: number, label: string, color: string }) => {
    const strokeDashoffset = getStrokeDashoffset(value, max);
    return (
      <div className="flex flex-col items-center mx-2 md:mx-6">
        <div className="relative flex items-center justify-center w-28 h-28 md:w-36 md:h-36">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} stroke="#4b5563" strokeWidth="8" fill="none" />
            <circle 
              cx="60" 
              cy="60" 
              r={radius} 
              stroke={color} 
              strokeWidth="8" 
              fill="none" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
             <span className="text-[10px] md:text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">{label}</span>
             <span className="text-3xl md:text-4xl font-extrabold text-gray-700">{value}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-16 bg-white" id="yks-sayac">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1e1b4b] mb-4">YKS Sayaç</h2>
        <p className="text-gray-600 mb-10 text-sm md:text-base leading-relaxed">
          2026 TYT ve 2026 AYT için kalan süreyi burada görebilirsiniz. YKS geri sayım sayacını sayfamızdan takip edebilirsiniz. "YKS'ye kaç gün kaldı?" merak ediyorsan aşağıdaki YKS sayaç aracı senin için anlık olarak kalan süreyi gösteriyor.
        </p>

        <div className="flex justify-center flex-wrap mb-16 gap-y-6">
          <Circle value={timeLeft.days} max={365} label="GÜN" color="#eab308" />
          <Circle value={timeLeft.hours} max={24} label="SAAT" color="#0ea5e9" />
          <Circle value={timeLeft.minutes} max={60} label="DAKİKA" color="#22c55e" />
          <Circle value={timeLeft.seconds} max={60} label="SANİYE" color="#14b8a6" />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-[#1e1b4b] mb-4">2026 YKS Geri Sayım Başladı</h3>
        <div className="text-gray-600 text-sm md:text-base space-y-4 leading-relaxed">
          <p>
            2026 YKS için geri sayım başladı. TYT, AYT ve YDT için sınava kaç gün kaldı? 2026 YKS <strong>20 Haziran 2026 Cumartesi günü</strong> başlıyor. ÖSYM'nin 2026 için açıkladığı sınav takvimine göre 21 Haziran 2026'da TYT 21 Haziran 2026'da AYT ve YDT gerçekleşecek.
          </p>
          <p>
            Bir sonraki YKS <strong>20 ve 21 Haziran 2026</strong> günleri gerçekleşecek. YKS'nin oturumlarının gün ve saatleri şu şekilde:
          </p>
          <ul className="space-y-2 list-none">
            <li><strong>2026 TYT:</strong> 20 Haziran 2026 Cumartesi, 10.15</li>
            <li><strong>2026 AYT:</strong> 21 Haziran 2026 Pazar, 10.15</li>
            <li><strong>2026 YDT:</strong> 21 Haziran 2026 Pazar, 15.45</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
