import { requireAdminToken } from "@/app/admin/lib/auth";
import { adminGet } from "@/app/admin/lib/strapi-admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import RotaForm from "../../../rota-form";
import {
  analysisConfig,
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
  params: Promise<{ id: string; rotaId: string }>;
}) {
  const token = await requireAdminToken();
  const { id, rotaId } = await params;

  const [an, res, pr, bk, ins] = await Promise.all([
    adminGet(`/analyses/${id}`, token),
    adminGet(
      `/programs/${rotaId}?populate[cover]=true&populate[downloadPdf]=true&populate[books]=true&populate[instructors]=true`,
      token
    ),
    adminGet(
      `/programs?filters[analysis][documentId][$eq]=${id}&pagination[pageSize]=200`,
      token
    ),
    adminGet("/books?populate[cover]=true&sort=title:asc&pagination[pageSize]=100", token),
    adminGet("/instructors?populate[photo]=true&sort=displayOrder:asc&pagination[pageSize]=100", token),
  ]);

  const analysis = an.data?.data;
  const program = res.data?.data;
  if (!analysis || !program) return notFound();

  const config = analysisConfig(analysis);
  const branches = activeNetBranches(config);

  // Dolu kombinasyonlar — düzenlenen programın kendisi hariç, yoksa kendi
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
              href={`/admin/analiz/${id}`}
              style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}
            >
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> {analysis.title}
            </Link>
          </div>
          <h1>Rota Düzenle: {program.title}</h1>
        </div>
        <div className="topbar-actions">
          {program.slug && analysis.slug && (
            <Link
              href={`/analiz/${analysis.slug}/${program.slug}`}
              target="_blank"
              className="btn btn-ghost"
            >
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
          analizId={id}
          analizSlug={analysis.slug || ""}
          books={bk.data?.data || []}
          instructors={ins.data?.data || []}
        />
      </div>
    </>
  );
}
