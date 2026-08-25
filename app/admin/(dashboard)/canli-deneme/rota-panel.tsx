"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CORE_NET_BRANCHES,
  liveExamCombinations,
  matchLiveExamProgram,
  netLevelsKey,
  netLevelWord,
  programNetLevels,
  NET_BRANCH_SHORT,
  type NetLevels,
  type NetLevel,
  type NetBranch,
  type LiveExamConfig,
} from "@/app/lib/strapi";

// Yükleme hatasında sebebi de döndürür; "yüklenemedi" deyip susmak yerine
// panelde gerçek nedeni gösterebilmek için.
async function uploadFile(file: File): Promise<{ id: number } | { error: string }> {
  if (file.size > 10 * 1024 * 1024) {
    return { error: `dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)} MB)` };
  }
  const fd = new FormData();
  fd.append("files", file);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // JSON değil; ham metni kısaltıp göster.
    }
    if (!res.ok) {
      const msg =
        data?.error?.message || (typeof data?.error === "string" ? data.error : null) || text.slice(0, 120);
      return { error: `HTTP ${res.status} — ${msg || "sunucu yanıtı boş"}` };
    }
    const id = Array.isArray(data) ? data[0]?.id : data?.id;
    if (!id) return { error: "sunucu dosya kimliği döndürmedi" };
    return { id };
  } catch {
    return { error: "sunucuya ulaşılamadı" };
  }
}

export type RouteRow = {
  documentId: string;
  title: string;
  slug: string;
  routeCode: string;
  matLevel?: NetLevel;
  turkceLevel?: NetLevel;
  fenLevel?: NetLevel;
  sosyalLevel?: NetLevel;
  hasVideo: boolean;
  hasPdf: boolean;
};

export function comboHref(combo: NetLevels, branches: NetBranch[]): string {
  const sp = new URLSearchParams();
  for (const b of branches) sp.set(b, combo[b] as string);
  return `/admin/canli-deneme/yeni?${sp.toString()}`;
}

export default function RotaPanel({
  routes,
  config,
  imageUrl,
  topbarTitle,
}: {
  routes: RouteRow[];
  config: LiveExamConfig;
  imageUrl?: string;
  topbarTitle?: React.ReactNode;
}) {
  const router = useRouter();

  const [sosyalEnabled, setSosyalEnabled] = useState(config.sosyalEnabled);
  const [thresholds, setThresholds] = useState<Record<string, string>>({
    mat: String(config.thresholds.mat),
    turkce: String(config.thresholds.turkce),
    fen: String(config.thresholds.fen),
    sosyal: String(config.thresholds.sosyal),
  });
  const [bannerEnabled, setBannerEnabled] = useState(config.bannerEnabled);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(imageUrl || "");
  const [imageCleared, setImageCleared] = useState(false);

  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const branches = useMemo<NetBranch[]>(
    () => (sosyalEnabled ? [...CORE_NET_BRANCHES, "sosyal"] : [...CORE_NET_BRANCHES]),
    [sosyalEnabled]
  );
  const combos = useMemo(() => liveExamCombinations(branches), [branches]);

  function thresholdOf(key: NetBranch): number {
    const v = parseInt(thresholds[key], 10);
    return Number.isFinite(v) && v > 0 ? v : config.thresholds[key];
  }

  const cells = combos.map((combo) => ({
    combo,
    key: netLevelsKey(combo, branches),
    program: matchLiveExamProgram(routes, combo, branches),
  }));

  const filled = cells.filter((c) => c.program).length;
  const placed = new Set(cells.map((c) => c.program?.documentId).filter(Boolean));

  function comboLabel(levels: NetLevels): string {
    return branches
      .map((b) => `${thresholdOf(b)} ${netLevelWord(levels[b])}`)
      .join(" · ");
  }

  async function saveSettings() {
    setSaving(true);
    try {
      // Yeni dosya secildiyse once yukle; secilmediyse alani hic gondermeyip
      // mevcut gorseli oldugu gibi birak. Kaldir denmisse null gonder.
      let imagePatch: Record<string, unknown> = {};
      if (imageFile) {
        const up = await uploadFile(imageFile);
        if ("error" in up) {
          showToast(`Görsel yüklenemedi: ${up.error}`, "error");
          return;
        }
        imagePatch = { liveExamImage: up.id };
      } else if (imageCleared) {
        imagePatch = { liveExamImage: null };
      }

      const res = await fetch("/api/admin/global-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveExamConfig: {
            thresholds: {
              mat: thresholdOf("mat"),
              turkce: thresholdOf("turkce"),
              fen: thresholdOf("fen"),
              sosyal: thresholdOf("sosyal"),
            },
            maxNets: config.maxNets,
            sosyalEnabled,
            collectSosyal: config.collectSosyal,
            bannerEnabled,
          },
          ...imagePatch,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d?.error || "Ayarlar kaydedilemedi", "error");
        return;
      }
      showToast("Ayarlar kaydedildi ✓");
      setImageFile(null);
      setImageCleared(false);
      router.refresh();
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRoute(row: RouteRow) {
    if (!confirm(`"${row.title}" programını silmek istediğinize emin misiniz?`)) return;
    setBusy(row.documentId);
    try {
      const res = await fetch(`/api/admin/programs/${row.documentId}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Silinemedi", "error");
        return;
      }
      showToast("Program silindi ✓");
      router.refresh();
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {toast && <div className={`toast show toast-${toast.type}`}>{toast.msg}</div>}

      <div className="admin-topbar">
        {topbarTitle}
        <div className="topbar-actions">
          <Link href="/canli-deneme" target="_blank" className="btn btn-ghost">
            <span className="ms">open_in_new</span>
            Sayfayı Gör
          </Link>
          <button type="button" className="btn btn-ghost" onClick={saveSettings} disabled={saving}>
            <span className="ms">save</span> {saving ? "Kaydediliyor…" : "Ayarları Kaydet"}
          </button>
          <Link href="/admin/canli-deneme/yeni" className="btn btn-primary">
            <span className="ms">add</span>
            Program Ekle
          </Link>
        </div>
      </div>

      <div className="admin-content">

      {/* ---- Eşik ayarları ---- */}
      <div className="info-card" style={{ marginBottom: "20px" }}>
        <div className="card-title">
          <span className="ms">tune</span> Eşik Değerleri
        </div>
        <p style={{ fontSize: "0.74rem", color: "#64748b", margin: "0 0 14px", lineHeight: 1.55 }}>
          Öğrencinin neti bu değere <strong style={{ color: "#94a3b8" }}>eşit veya büyükse</strong>{" "}
          &quot;üstü&quot;, küçükse &quot;altı&quot; sayılır. Bütün rotalar için ortaktır.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          {([...CORE_NET_BRANCHES, "sosyal"] as NetBranch[]).map((b) => {
            const off = b === "sosyal" && !sosyalEnabled;
            return (
              <div key={b} className="form-group" style={{ width: "128px", marginBottom: 0, opacity: off ? 0.45 : 1 }}>
                <label>{NET_BRANCH_SHORT[b]}</label>
                <input
                  type="number"
                  min={1}
                  value={thresholds[b]}
                  disabled={off}
                  onChange={(e) => setThresholds((p) => ({ ...p, [b]: e.target.value }))}
                />
              </div>
            );
          })}

          <label style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer", margin: "0 0 9px", padding: "9px 12px", borderRadius: "8px", background: "#0b1628", border: "1px solid #1e3a5f" }}>
            <input
              type="checkbox"
              checked={sosyalEnabled}
              onChange={(e) => setSosyalEnabled(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.82rem", color: "#e2e8f0" }}>Sosyal dahil</span>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
                color: sosyalEnabled ? "#c4b5fd" : "#94a3b8",
                background: sosyalEnabled ? "rgba(168,85,247,0.18)" : "rgba(148,163,184,0.14)",
              }}
            >
              {combos.length} kombinasyon
            </span>
          </label>

        </div>

        <p style={{ fontSize: "0.68rem", color: "#475569", margin: "12px 0 0", lineHeight: 1.55 }}>
          Sosyal kapalıyken 3 branş → 8 program gerekir; net alınır ama programı etkilemez. Açıldığında
          4 branş → 16 program gerekir.
        </p>

        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed #1e3a5f" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
            <label style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0 }}>Banner Görseli</label>
            <label style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer", margin: 0, padding: "7px 11px", borderRadius: "8px", background: "#0b1628", border: "1px solid #1e3a5f" }}>
              <input
                type="checkbox"
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.8rem", color: bannerEnabled ? "#e2e8f0" : "#64748b" }}>
                {bannerEnabled ? "Banner açık" : "Banner kapalı"}
              </span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                width: "170px",
                height: "58px",
                background: "#0f172a",
                border: "1.5px dashed #1e3a5f",
                borderRadius: "10px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                backgroundImage: imagePreview ? `url(${imagePreview})` : undefined,
                backgroundRepeat: "repeat-x",
                backgroundPosition: "center",
                backgroundSize: "auto 100%",
              }}
            >
              {!imagePreview && (
                <span className="ms" style={{ color: "#334155", fontSize: "22px" }}>panorama</span>
              )}
            </div>

            <label className="btn btn-ghost btn-sm" style={{ borderStyle: "solid", borderColor: "#1e3a5f", cursor: "pointer" }}>
              <span className="ms">upload</span> Görsel Seç
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setImageFile(f);
                  setImageCleared(false);
                  if (f) setImagePreview(URL.createObjectURL(f));
                }}
              />
            </label>

            {imagePreview && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                  setImageCleared(true);
                }}
              >
                <span className="ms">close</span> Kaldır
              </button>
            )}
          </div>

          <p style={{ fontSize: "0.68rem", color: "#475569", margin: "10px 0 0", lineHeight: 1.55 }}>
            Sayfa başlığının hemen altında, ekranı boydan boya kaplayan bir şerit olarak görünür.
            Görsel yatayda tekrarlanır, yani tek bir afiş yan yana dizilir. Önizleme kutusu da aynı
            şekilde tekrarlayarak gösterir.
          </p>
        </div>

      </div>

      {/* ---- Kapsama şeridi ---- */}
      <div className="info-card" style={{ marginBottom: "20px" }}>
        <div
          className="card-title"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}
        >
          <span><span className="ms">grid_view</span> Kapsama</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: filled === cells.length ? "#4ade80" : "#fbbf24" }}>
            {filled} / {cells.length} kombinasyon dolu
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
          {cells.map((cell) => {
            const p = cell.program;
            const href = p ? `/admin/canli-deneme/${p.documentId}` : comboHref(cell.combo, branches);
            return (
              <Link
                key={cell.key}
                href={href}
                title={p ? `${p.title} — düzenle` : "Bu kombinasyon için program oluştur"}
                style={{
                  display: "block",
                  padding: "10px 8px",
                  borderRadius: "8px",
                  textAlign: "center",
                  textDecoration: "none",
                  background: p ? "rgba(34,197,94,0.12)" : "#0b1628",
                  border: p ? "1px solid rgba(34,197,94,0.4)" : "1px dashed #1e3a5f",
                }}
              >
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: p ? "#4ade80" : "#475569" }}>
                  {p ? (p.routeCode ? `Rota ${p.routeCode}` : "Atandı") : "Boş"}
                </span>
                <span style={{ display: "block", marginTop: "3px", fontSize: "0.66rem", color: p ? "#86efac" : "#475569" }}>
                  {branches.map((b) => netLevelWord(cell.combo[b])).join(" · ")}
                </span>
              </Link>
            );
          })}
        </div>

        <p style={{ fontSize: "0.68rem", color: "#475569", margin: "12px 0 0" }}>
          Sıra: {branches.map((b) => NET_BRANCH_SHORT[b]).join(" · ")}. Boş bir kutuya tıklayınca o
          kombinasyon seçili halde form açılır.
        </p>
      </div>

      {/* ---- Program tablosu ---- */}
      <div className="table-card">
        <div className="table-header">
          <h3>{routes.length} Rota Programı</h3>
        </div>

        {routes.length === 0 ? (
          <div className="empty-state">
            <span className="ms">track_changes</span>
            Henüz rota programı yok. Yukarıdaki boş kutulardan birine ya da &quot;Program Ekle&quot;ye tıklayın.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: "70px" }}>Rota</th>
                <th>Başlık / Slug</th>
                <th>Kombinasyon</th>
                <th style={{ width: "90px" }}>İçerik</th>
                <th style={{ width: "100px" }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((row) => {
                const levels = programNetLevels(row);
                const fits = placed.has(row.documentId);
                return (
                  <tr key={row.documentId}>
                    <td>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#60a5fa" }}>
                        {row.routeCode || "—"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#e2e8f0" }}>{row.title}</strong>
                      <br />
                      <small style={{ color: "#475569" }}>/canli-deneme/{row.slug}</small>
                    </td>
                    <td style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                      {fits && levels ? (
                        comboLabel(levels)
                      ) : (
                        <span style={{ color: "#fbbf24" }}>
                          <span className="ms" style={{ fontSize: "14px", verticalAlign: "-2px" }}>warning</span>{" "}
                          Kombinasyon tutmuyor
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className="ms"
                        title={row.hasVideo ? "Video var" : "Video yok"}
                        style={{ fontSize: "17px", color: row.hasVideo ? "#94a3b8" : "#334155", marginRight: "6px" }}
                      >
                        play_circle
                      </span>
                      <span
                        className="ms"
                        title={row.hasPdf ? "PDF var" : "PDF yok"}
                        style={{ fontSize: "17px", color: row.hasPdf ? "#94a3b8" : "#334155" }}
                      >
                        picture_as_pdf
                      </span>
                    </td>
                    <td>
                      <div className="td-actions">
                        <Link href={`/admin/canli-deneme/${row.documentId}`} className="btn btn-ghost btn-sm btn-icon">
                          <span className="ms">edit</span>
                        </Link>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => deleteRoute(row)}
                          disabled={busy === row.documentId}
                        >
                          <span className="ms">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </>
  );
}
