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
} from "@/app/lib/strapi";

export const metadata = { title: "Yeni Rota Programı | Admin" };

export default async function YeniRotaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await requireAdminToken();
  const { id } = await params;
  const sp = await searchParams;

  const [an, pr, bk, ins] = await Promise.all([
    adminGet(`/analyses/${id}`, token),
    // Dolu kombinasyon kontrolu SADECE bu analiz icinde yapilir; ayni
    // kombinasyon baska analizlerde serbest.
    adminGet(
      `/programs?filters[analysis][documentId][$eq]=${id}&pagination[pageSize]=200`,
      token
    ),
    adminGet("/books?populate[cover]=true&sort=title:asc&pagination[pageSize]=100", token),
    adminGet("/instructors?populate[photo]=true&sort=displayOrder:asc&pagination[pageSize]=100", token),
  ]);

  const analysis = an.data?.data;
  if (!analysis) return notFound();

  const config = analysisConfig(analysis);
  const branches = activeNetBranches(config);

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
              href={`/admin/analiz/${id}`}
              style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.8rem", display: "flex", alignItems: "center" }}
            >
              <span className="ms" style={{ fontSize: "16px" }}>arrow_back</span> {analysis.title}
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
          analizId={id}
          analizSlug={analysis.slug || ""}
          books={bk.data?.data || []}
          instructors={ins.data?.data || []}
        />
      </div>
    </>
  );
}
