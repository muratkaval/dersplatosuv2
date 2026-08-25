"use client";

import { useState, useEffect, useMemo, useRef, type CSSProperties } from "react";
import Link from "next/link";
import {
  netLevel,
  netLevelWord,
  matchLiveExamProgram,
  netLevelsKey,
  liveExamCombinations,
  activeNetBranches,
  visibleNetBranches,
  NET_BRANCH_LABELS,
  NET_BRANCH_SHORT,
  NET_BRANCH_ICONS,
  type NetLevel,
  type NetBranch,
  type NetLevels,
  type LiveExamConfig,
} from "@/app/lib/strapi";

// Sayfadan taşınan yalın rota nesnesi. Tam Program'ı client'a geçirmiyoruz;
// haftalar, kitaplar ve hocalar burada kullanılmıyor.
export type RouteProgram = {
  id: number;
  routeCode?: string;
  title: string;
  slug: string;
  description?: string;
  matLevel?: NetLevel;
  turkceLevel?: NetLevel;
  fenLevel?: NetLevel;
  sosyalLevel?: NetLevel;
  pdfUrl?: string;
};

const TONES: Record<NetBranch, string> = {
  mat: "blue",
  turkce: "orange",
  fen: "green",
  sosyal: "purple",
};

const BENEFITS = [
  "Kişiye özel günlük çalışma planı",
  "Konu tekrar ve soru çözüm dengesi",
  "Deneme ve analiz planlaması",
  "Eksiklerine özel strateji önerileri",
];

const LOADING_MESSAGES = [
  "Netlerin okunuyor…",
  "Güçlü ve zayıf branşların belirleniyor…",
  "Programlar arasında eşleştirme yapılıyor…",
  "Programın hazırlanıyor…",
];

const LOADING_STEP_MS = 800;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// Net değerleri çeyrekli olabiliyor (doğru - yanlış/4). "12,5" de "12.5" de kabul.
function parseNet(raw: string, max: number): number {
  const v = parseFloat(String(raw).replace(",", "."));
  return Number.isFinite(v) ? clamp(v, 0, max) : 0;
}

function fmtNet(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}

export default function NetMatcher({
  routes,
  config,
}: {
  routes: RouteProgram[];
  config: LiveExamConfig;
}) {
  // Eşleştirmeye giren branşlar (sosyal kapalıysa 3, açıksa 4) ve
  // ekranda kutusu görünen branşlar farklı olabilir: sosyal sadece
  // bilgi amaçlı toplanıyorsa görünür ama eşleştirmeye girmez.
  const activeBranches = useMemo(() => activeNetBranches(config), [config]);
  const shownBranches = useMemo(() => visibleNetBranches(config), [config]);
  const combos = useMemo(() => liveExamCombinations(activeBranches), [activeBranches]);

  const [raw, setRaw] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "stale">("idle");
  const [loadingStep, setLoadingStep] = useState(0);
  // Gosterilen sonucun dondurulmus hali: netler degisse bile panel bunu
  // gosterir, yeni sonuc ancak butona basilinca uretilir.
  const [shown, setShown] = useState<{ levels: NetLevels; raw: Record<string, string> } | null>(
    null
  );
  const resultRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const submitted = phase === "done";

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  function levelsFrom(r: Record<string, string>): NetLevels {
    const out: NetLevels = {};
    for (const b of activeBranches) {
      out[b] = netLevel(parseNet(r[b] || "", config.maxNets[b]), config.thresholds[b]);
    }
    return out;
  }

  // Sayfadan cikilirken bekleyen zamanlayicilar kalmasin.
  useEffect(() => clearTimers, []);

  // Paylaşılan linki geri yükle: /canli-deneme?mat=12&turkce=18&fen=8
  // Eşleştirmeye giren branşların hepsi varsa sonuç doğrudan açılır.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const next: Record<string, string> = {};
    let complete = true;
    for (const b of shownBranches) {
      const v = sp.get(b);
      if (v === null) {
        if (activeBranches.includes(b)) complete = false;
        continue;
      }
      next[b] = fmtNet(parseNet(v, config.maxNets[b]));
    }
    if (Object.keys(next).length) setRaw(next);
    if (complete) {
      setShown({ levels: levelsFrom(next), raw: next });
      setPhase("done");
    }
    // Sadece ilk açılışta çalışmalı; sonradan girilen neti sıfırlamasın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nets = useMemo(() => {
    const out: Record<string, number> = {};
    for (const b of shownBranches) out[b] = parseNet(raw[b] || "", config.maxNets[b]);
    return out;
  }, [raw, shownBranches, config]);

  const levels: NetLevels = useMemo(() => {
    const out: NetLevels = {};
    for (const b of activeBranches) out[b] = netLevel(nets[b] || 0, config.thresholds[b]);
    return out;
  }, [nets, activeBranches, config]);

  // Netler degistiginde panel canli guncellenmez; sonuc eskimis duruma gecer.
  // Sadece kombinasyon degistiyse tetiklenir: ayni aralik icindeki oynamalar
  // programi degistirmedigi icin paneli bozmaya gerek yok.
  useEffect(() => {
    if (phase !== "done" || !shown) return;
    if (netLevelsKey(levels, activeBranches) !== netLevelsKey(shown.levels, activeBranches)) {
      setPhase("stale");
    }
  }, [levels, phase, shown, activeBranches]);

  const resultLevels = shown?.levels ?? levels;

  const match = useMemo(
    () => (shown ? matchLiveExamProgram(routes, shown.levels, activeBranches) : null),
    [routes, shown, activeBranches]
  );

  const filled = activeBranches.every((b) => (raw[b] || "").trim() !== "");

  function setBranch(key: NetBranch, value: string) {
    setRaw((prev) => ({ ...prev, [key]: value }));
  }

  // Eslestirme aslinda anlik; asamali bekleme bilerek konuldu. Ogrenci
  // netlerini girdikten sonra sonucun "hazirlandigini" gormesi, sonuca
  // duyulan guveni artiriyor. Sure LOADING_STEP_MS ile ayarlanir.
  function handleSubmit() {
    clearTimers();
    setLoadingStep(0);
    setPhase("loading");

    // Sonuc, butona basildigi andaki netlere gore uretilir ve orada donar.
    const snapRaw = { ...raw };
    const snapLevels = levelsFrom(snapRaw);

    const sp = new URLSearchParams();
    for (const b of shownBranches) {
      if (activeBranches.includes(b) || (raw[b] || "").trim() !== "") {
        sp.set(b, String(nets[b] || 0));
      }
    }
    window.history.replaceState({}, "", `${window.location.pathname}?${sp.toString()}`);

    // Masaustunde sonuc zaten yanda; dar ekranda alta indigi icin kaydir ki
    // hazirlanma animasyonu gozden kacmasin.
    if (window.innerWidth < 980) {
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }

    for (let i = 1; i < LOADING_MESSAGES.length; i++) {
      timers.current.push(window.setTimeout(() => setLoadingStep(i), i * LOADING_STEP_MS));
    }
    timers.current.push(
      window.setTimeout(() => {
        setShown({ levels: snapLevels, raw: snapRaw });
        setPhase("done");
      }, LOADING_MESSAGES.length * LOADING_STEP_MS)
    );
  }

  // Geri alma: netleri sonucun uretildigi ana dondurur ve paneli tekrar acar.
  function restorePrevious() {
    if (!shown) return;
    clearTimers();
    setRaw(shown.raw);
    setPhase("done");
  }

  const levelSummary = activeBranches
    .map((b) => `${NET_BRANCH_SHORT[b]} ${config.thresholds[b]} ${netLevelWord(resultLevels[b])}`)
    .join(" · ");

  return (
    <>
      <div className="cd-panel">
        {/* ---- Sol: net girişi ---- */}
        <div className="cd-form">
          <ol className="cd-steps">
            <li className="is-active">
              <span className="cd-step-no">1</span> Netlerini Gir
            </li>
            <li className={submitted ? "is-active" : ""}>
              <span className="cd-step-no">2</span> Programını Al
            </li>
          </ol>

          <p className="cd-form-intro">
            Aşağıdaki alanlara canlı deneme netlerini gir. Programın otomatik olarak belirlenecek.
          </p>

          {shownBranches.map((b) => {
            const inMatch = activeBranches.includes(b);
            const max = config.maxNets[b];
            const th = config.thresholds[b];
            const val = nets[b] || 0;
            const pct = max > 0 ? (val / max) * 100 : 0;
            return (
              <div
                key={b}
                className={`cd-branch cd-tone-${TONES[b]}${inMatch ? "" : " cd-branch-muted"}`}
              >
                <div className="cd-branch-head">
                  <span className="cd-branch-icon ms">{NET_BRANCH_ICONS[b]}</span>
                  <span className="cd-branch-name">
                    <strong>{NET_BRANCH_LABELS[b]}</strong>
                    <small>
                      {inMatch
                        ? `${th} net altı / ${th} net üstü`
                        : "Bu branş programa dahil değildir."}
                    </small>
                  </span>
                  <span className="cd-branch-input">
                    <label htmlFor={`net-${b}`}>Netini gir:</label>
                    <input
                      id={`net-${b}`}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={raw[b] || ""}
                      onChange={(e) => setBranch(b, e.target.value)}
                      placeholder="0"
                    />
                    <small>net</small>
                  </span>
                </div>

                {inMatch && (
                  <>
                    <input
                      type="range"
                      className="cd-slider"
                      min={0}
                      max={max}
                      step={0.25}
                      value={val}
                      onChange={(e) => setBranch(b, fmtNet(Number(e.target.value)))}
                      style={{ "--cd-fill": `${pct}%` } as CSSProperties}
                      aria-label={`${NET_BRANCH_LABELS[b]} neti`}
                    />
                    <div className="cd-branch-scale">
                      <small>{th} net altı</small>
                      <strong className={`cd-verdict cd-verdict-${levels[b]}`}>
                        {fmtNet(val)} net · {th} {netLevelWord(levels[b])}
                      </strong>
                      <small>{th} net üstü</small>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <button
            type="button"
            className="cd-submit"
            onClick={handleSubmit}
            disabled={!filled || phase === "loading"}
          >
            {phase === "loading" ? "Hazırlanıyor…" : "Programımı Oluştur"}{" "}
            <span className="ms">arrow_forward</span>
          </button>
          {!filled && (
            <p className="cd-submit-hint">
              {activeBranches.map((b) => NET_BRANCH_LABELS[b]).join(", ")} netlerinin hepsini gir.
            </p>
          )}
        </div>

        {/* ---- Sağ: sonuç ---- */}
        <aside className="cd-result" ref={resultRef}>
          <div className="cd-result-head">
            <span>Senin Programın</span>
            <span className="cd-result-trophy ms">emoji_events</span>
          </div>

          {phase === "loading" ? (
            <div className="cd-loading">
              <span className="cd-loading-ring" aria-hidden="true" />
              <p className="cd-loading-msg" key={loadingStep} aria-live="polite">
                {LOADING_MESSAGES[loadingStep]}
              </p>
              <span className="cd-loading-bar" aria-hidden="true">
                <span
                  style={{ width: `${((loadingStep + 1) / LOADING_MESSAGES.length) * 100}%` }}
                />
              </span>
              <p className="cd-loading-sub">Netlerine en uygun rota belirleniyor</p>
            </div>
          ) : phase === "idle" ? (

            <div className="cd-result-empty">
              <span className="ms">quiz</span>
              <p>
                Netlerini gir ve <strong>Programımı Oluştur</strong> butonuna bas; sana en uygun rota
                burada görünecek.
              </p>
            </div>
          ) : phase === "stale" ? (
            <div className="cd-result-empty cd-result-stale">
              <span className="ms">edit_note</span>
              <p>
                Netlerin değişti. Yeni programını görmek için <strong>Programımı Oluştur</strong>{" "}
                butonuna bas.
              </p>
              <button type="button" className="cd-btn cd-btn-ghost" onClick={restorePrevious}>
                <span className="ms">undo</span>
                {match?.routeCode
                  ? `Önceki programı aç (Rota ${match.routeCode})`
                  : "Önceki programı tekrar aç"}
              </button>
            </div>
          ) : match ? (
            <>
              <h2 className="cd-result-title">
                {match.routeCode ? `Rota ${match.routeCode}` : match.title}
              </h2>
              {match.routeCode && <p className="cd-result-program">{match.title}</p>}

              <div className="cd-badges">
                {activeBranches.map((b) => (
                  <span key={b} className={`cd-badge cd-tone-${TONES[b]}`}>
                    {NET_BRANCH_SHORT[b]}: {config.thresholds[b]} {netLevelWord(resultLevels[b])}
                  </span>
                ))}
              </div>

              <p className="cd-result-desc">
                {match.description ||
                  `${combos.length} özel programdan senin kombinasyonuna en uygun olanı belirlendi.`}
              </p>

              <ul className="cd-benefits">
                {BENEFITS.map((t) => (
                  <li key={t}>
                    <span className="ms">check</span>
                    {t}
                  </li>
                ))}
              </ul>

              <Link href={`/canli-deneme/${match.slug}`} className="cd-btn cd-btn-primary">
                Programı Görüntüle <span className="ms">arrow_forward</span>
              </Link>
              {match.pdfUrl && (
                <a
                  href={match.pdfUrl}
                  download={`${match.slug || "program"}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cd-btn cd-btn-ghost"
                >
                  <span className="ms">download</span> Programı PDF Olarak İndir
                </a>
              )}
            </>
          ) : (
            <div className="cd-result-empty cd-result-missing">
              <span className="ms">construction</span>
              <p>
                <strong>{levelSummary}</strong> kombinasyonu için program henüz yayınlanmadı. Çok
                yakında burada olacak.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ---- Rota ızgarası ----
           Yalnızca program üretildikten sonra görünür. Baştan gösterirsek
           öğrenci hazır bir listeden seçildiğini hisseder; önce kendi
           programını alsın, şeffaflık ondan sonra gelsin. */}
      {shown && (
      <section className="cd-routes">
        <div className="cd-routes-head">
          <h2>Diğer Rotalar</h2>
          <p>Senin rotan işaretli. Netlerin farklı olsaydı hangi programa denk gelirdin?</p>
        </div>

        <div className="cd-routes-grid">
          {combos.map((combo) => {
            const p = matchLiveExamProgram(routes, combo, activeBranches);
            const isActive =
              phase === "done" &&
              !!shown &&
              netLevelsKey(combo, activeBranches) === netLevelsKey(shown.levels, activeBranches);
            const card = (
              <>
                <span className="cd-route-code">
                  {p?.routeCode ? `Rota ${p.routeCode}` : "Yakında"}
                </span>
                <div className="cd-route-badges">
                  {activeBranches.map((b) => (
                    <span key={b} className={`cd-badge cd-tone-${TONES[b]}`}>
                      {NET_BRANCH_SHORT[b]}: {config.thresholds[b]} {netLevelWord(combo[b])}
                    </span>
                  ))}
                </div>
                {isActive && (
                  <span className="cd-route-flag">
                    <span className="ms">check_circle</span> Senin rotan
                  </span>
                )}
              </>
            );
            const cls = `cd-route${isActive ? " is-active" : ""}${p ? "" : " is-empty"}`;
            return p ? (
              <Link key={netLevelsKey(combo, activeBranches)} href={`/canli-deneme/${p.slug}`} className={cls}>
                {card}
              </Link>
            ) : (
              <div key={netLevelsKey(combo, activeBranches)} className={cls}>
                {card}
              </div>
            );
          })}
        </div>
      </section>
      )}
    </>
  );
}
