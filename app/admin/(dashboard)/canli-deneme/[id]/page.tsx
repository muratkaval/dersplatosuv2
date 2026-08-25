import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import RotaForm from "../rota-form";
import {
  readLiveExamConfig,
  activeNetBranches,
  isLiveExamProgram,
  programNetLevels,
  netLevelsKey,
  type NetLevels,
  type NetLevel,
} from "@/app/lib/strapi";

export const metadata = { title: "Rota Programı Düzenle | Admin" };

export default async function RotaDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await requireAdminToken();
  const { id } = await params;

  const res = await adminGet(
    `/programs/${id}?populate[cover]=true&populate[downloadPdf]=true`,
    token
  );
  const program = res.data?.data;
  if (!program) return notFound();

  const [gs, pr] = await Promise.all([
    adminGet("/global-setting", token),
    adminGet("/programs?pagination[pageSize]=200", token),
  ]);

  const config = readLiveExamConfig(gs.data?.data?.liveExamConfig);
  const branches = activeNetBranches(config);

  // Dolu kombinasyonlar - düzenlenen programın kendisi hariç, yoksa kendi
  // kombinasyonu pasif görünür ve kaydedilemez.
  const taken: Record<string, string> = {};
  for (const p of (pr.data?.data || []).filter(isLiveExamProgram)) {
    if (p.documentId === program.documentId) continue;
    const levels = programNetLevels(p);
    if (levels) taken[netLevelsKey(levels, branches)] = p.title || "(başlıksız)";
  }

  // Programın mevcut kombinasyonu. Sosyal sonradan açıldıysa etiketi olmayan
  // programda "altı" varsayılır; kaydederken düzeltilebilir.
  const initialLevels: NetLevels = {};
  for (const b of branches) {
    const key = `${b}Level` as "matLevel" | "turkceLevel" | "fenLevel" | "sosyalLevel";
    initialLevels[b] = (program[key] === "ustu" ? "ustu" : "alti") as NetLevel;
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
          <h1>Rota Düzenle: {program.title}</h1>
        </div>
        <div className="topbar-actions">
          {program.slug && (
            <Link href={`/canli-deneme/${program.slug}`} target="_blank" className="btn btn-ghost">
              <span className="ms">open_in_new</span>
              Sayfayı Gör
            </Link>
          )}
        </div>
      </div>

      <div className="admin-content">
        <RotaForm
          program={program}
          initialLevels={initialLevels}
          branches={branches}
          config={config}
          taken={taken}
        />
      </div>
    </>
  );
}
