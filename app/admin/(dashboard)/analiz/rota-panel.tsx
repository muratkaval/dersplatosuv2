"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  activeNetBranches,
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

export default function RotaPanel({
  routes,
  config,
  analizId,
}: {
  routes: RouteRow[];
  config: LiveExamConfig;
  /** Analizin documentId'si; rota linkleri bunun altına kurulur. */
  analizId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Eşikler ve Sosyal anahtarı artık analizin kendi kaydından geliyor;
  // bu panel onları sadece okuyor, düzenleme üstteki analiz formunda.
  const branches = useMemo<NetBranch[]>(() => activeNetBranches(config), [config]);
  const combos = useMemo(() => liveExamCombinations(branches), [branches]);

  const cells = combos.map((combo) => ({
    combo,
    key: netLevelsKey(combo, branches),
    program: matchLiveExamProgram(routes, combo, branches),
  }));

  const filled = cells.filter((c) => c.program).length;
  const placed = new Set(cells.map((c) => c.program?.documentId).filter(Boolean));
  const orphans = routes.filter((r) => !placed.has(r.documentId));

  function comboLabel(levels: NetLevels): string {
    return branches.map((b) => `${config.thresholds[b]} ${netLevelWord(levels[b])}`).join(" · ");
  }

  function yeniRotaHref(combo: NetLevels): string {
    const sp = new URLSearchParams();
    for (const b of branches) sp.set(b, combo[b] as string);
    return `/admin/analiz/${analizId}/rota/yeni?${sp.toString()}`;
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
            const href = p
              ? `/admin/analiz/${analizId}/rota/${p.documentId}`
              : yeniRotaHref(cell.combo);
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
            Bu analizde henüz program yok. Yukarıdaki boş kutulardan birine ya da &quot;Program Ekle&quot;ye tıklayın.
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
                      <small style={{ color: "#475569" }}>{row.slug}</small>
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
                        <Link
                          href={`/admin/analiz/${analizId}/rota/${row.documentId}`}
                          className="btn btn-ghost btn-sm btn-icon"
                        >
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

      {orphans.length > 0 && (
        <p style={{ fontSize: "0.72rem", color: "#fbbf24", marginTop: "12px" }}>
          {orphans.length} program şu anki kombinasyonlardan hiçbirine düşmüyor. Genellikle Sosyal
          açılıp etiketi eksik kaldığında olur; düzenleyip kombinasyonunu seçin.
        </p>
      )}
    </>
  );
}
