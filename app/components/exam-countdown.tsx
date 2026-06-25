"use client";

import { useEffect, useState } from "react";
import type { Countdown } from "@/app/lib/strapi";

type Props = {
  countdown: Countdown;
};

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

const COLORS = ["#eab308", "#0ea5e9", "#22c55e", "#14b8a6"];

function RingUnit({
  value,
  max,
  label,
  color,
}: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="exam-ring-wrap">
      <div className="exam-ring-svg-wrap">
        <svg className="exam-ring-svg" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} stroke="#e5e7eb" strokeWidth="9" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeWidth="9"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="exam-ring-progress"
          />
        </svg>
        <div className="exam-ring-inner">
          <span className="exam-ring-label">{label}</span>
          <span className="exam-ring-value">{value}</span>
        </div>
      </div>
    </div>
  );
}

export default function ExamCountdown({ countdown }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(countdown.targetDate));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(countdown.targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown.targetDate]);

  if (!mounted) return null;

  const units = [
    { value: timeLeft.days, max: 365, label: "GÜN", color: COLORS[0] },
    { value: timeLeft.hours, max: 24, label: "SAAT", color: COLORS[1] },
    { value: timeLeft.minutes, max: 60, label: "DAKİKA", color: COLORS[2] },
    { value: timeLeft.seconds, max: 60, label: "SANİYE", color: COLORS[3] },
  ];

  const words = countdown.title.trim().split(" ");
  const lastWord = words.length > 1 ? words.pop() : "";
  const firstPart = words.join(" ");

  return (
    <>
      {/* Top: title + description (Page Hero style) */}
      <section className="page-hero">
        <div className="page-hero-inner" style={{ paddingBottom: "30px" }}>
          <h1>
            {firstPart} {lastWord && <span>{lastWord}</span>}
            {!lastWord && <span>{firstPart}</span>}
          </h1>
          {countdown.description && (
            <p>{countdown.description}</p>
          )}
        </div>
      </section>

      <section className="exam-countdown-section" id="sayac" style={{ paddingTop: "40px" }}>
        {/* Rings */}
        {timeLeft.expired ? (
          <div className="exam-countdown-expired">🎉 Sınav başladı!</div>
        ) : (
          <div className="exam-countdown-rings">
            {units.map((u) => (
              <RingUnit key={u.label} {...u} />
            ))}
          </div>
        )}

        {/* Session table */}
        {countdown.sessions && countdown.sessions.length > 0 && (
          <div className="exam-sessions">
            <table className="exam-sessions-table">
              <tbody>
                {countdown.sessions.map((s, i) => (
                  <tr key={i} className="exam-session-row">
                    <td className="exam-session-name">{s.sessionName}</td>
                    <td className="exam-session-date">{s.sessionDate}</td>
                    <td className="exam-session-time">{s.sessionTime && `Saat: ${s.sessionTime}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom section */}
        {(countdown.bottomTitle || countdown.bottomText) && (
          <div className="exam-countdown-bottom">
            {countdown.bottomTitle && (
              <h2 className="exam-countdown-bottom-title">{countdown.bottomTitle}</h2>
            )}
            {countdown.bottomText && (
              <div 
                className="exam-countdown-bottom-text" 
                dangerouslySetInnerHTML={{ __html: countdown.bottomText }} 
              />
            )}
          </div>
        )}
      </section>
    </>
  );
}
