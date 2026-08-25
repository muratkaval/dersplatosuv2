import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import RotaForm from "../rota-form";
import {
  readLiveExamConfig,
  activeNetBranches,
  isLiveExamProgram,
  programNetLevels,
  netLevelsKey,
  type NetLevels,
} from "@/app/lib/strapi";

export const metadata = { title: "Yeni Rota Programı | Admin" };

export default async function YeniRotaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await requireAdminToken();
  const sp = await searchParams;

  const [gs, pr] = await Promise.all([
    adminGet("/global-setting", token),
    adminGet("/programs?pagination[pageSize]=200", token),
  ]);

  const config = readLiveExamConfig(gs.data?.data?.liveExamConfig);
  const branches = activeNetBranches(config);

  // Dolu kombinasyonlar: formda pasif görünecekler.
  const taken: Record<string, string> = {};
  for (const p of (pr.data?.data || []).filter(isLiveExamProgram)) {
    const levels = programNetLevels(p);
    if (levels) taken[netLevelsKey(levels, branches)] = p.title || "(başlıksız)";
  }

  // Kapsama şeridindeki boş kutudan gelindiyse o kombinasyon seçili açılır.
  // Doğrudan "Program Ekle" ile gelindiyse form ilk boş kombinasyona düşer.
  const partial: NetLevels = {};
  let hasPreset = true;
  for (const b of branches) {
    const v = sp[b];
    if (v !== "alti" && v !== "ustu") {
      hasPreset = false;
      break;
    }
    partial[b] = v;
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="topbar-title">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link
              href="/admin/canli-deneme"
              style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}
            >
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> Canlı Denemeye Dön
            </Link>
          </div>
          <h1>Yeni Rota Programı</h1>
        </div>
      </div>

      <div className="admin-content">
        <RotaForm
          initialLevels={hasPreset ? partial : undefined}
          branches={branches}
          config={config}
          taken={taken}
        />
      </div>
    </>
  );
}
