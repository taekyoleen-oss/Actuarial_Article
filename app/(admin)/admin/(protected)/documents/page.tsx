import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAdminDocuments, listAdminSources } from "@/lib/supabase/queries/admin";
import { registerDocument } from "@/lib/actions/documents";
import {
  BUSINESS_AREAS,
  BUSINESS_AREA_LABELS,
  DEPTH_STAGES,
  DEPTH_STAGE_LABELS,
  PRIMARY_TOPICS,
  PRIMARY_TOPIC_LABELS,
  REGIONS,
  REGION_LABELS,
  TRACKS,
} from "@/types/domain";
import { relativeTimeKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "문서 관리 — 관리자" };

export default async function AdminDocumentsPage() {
  let docs: Awaited<ReturnType<typeof listAdminDocuments>> = [];
  let sources: Awaited<ReturnType<typeof listAdminSources>> = [];
  try {
    [docs, sources] = await Promise.all([
      listAdminDocuments({ limit: 100 }),
      listAdminSources(),
    ]);
  } catch {
    docs = [];
    sources = [];
  }

  const hasSources = sources.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">문서 관리</h1>
          <p className="text-sm text-[color:var(--color-muted-foreground)]">
            URL 등록 → 깊이 승격 → 게시
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 문서 등록</CardTitle>
          {!hasSources ? (
            <p className="text-xs text-[color:var(--color-destructive)]">
              먼저 <Link href="/admin/sources" className="underline">소스를 등록</Link>해야 합니다.
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <form action={registerDocument} className="grid gap-3 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-semibold">소스</span>
              <select
                name="source_id"
                required
                disabled={!hasSources}
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              >
                <option value="">소스 선택…</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.organization})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-semibold">원문 URL</span>
              <input
                name="original_url"
                type="url"
                required
                placeholder="https://www.soa.org/.../report.pdf"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-semibold">원문 제목</span>
              <input
                name="title"
                required
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-semibold">한국어 제목 (선택)</span>
              <input
                name="title_ko"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">Region</span>
              <select
                name="region"
                defaultValue="overseas"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {REGION_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">Track</span>
              <select
                name="track"
                defaultValue="admin_curated"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              >
                {TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">주제</span>
              <select
                name="primary_topic"
                defaultValue="other"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              >
                {PRIMARY_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {PRIMARY_TOPIC_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">목표 깊이 단계</span>
              <select
                name="target_depth_stage"
                defaultValue="interpreted"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              >
                {DEPTH_STAGES.map((d) => (
                  <option key={d} value={d}>
                    {DEPTH_STAGE_LABELS[d]} ({d})
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="text-sm md:col-span-2">
              <legend className="mb-1 block text-xs font-semibold">업무영역 (다중)</legend>
              <div className="flex flex-wrap gap-3">
                {BUSINESS_AREAS.map((area) => (
                  <label key={area} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="business_areas" value={area} />
                    {BUSINESS_AREA_LABELS[area]}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">발행일 (선택)</span>
              <input
                name="published_at"
                type="date"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_members_only_source" />
              Members-only 자료 (체크 시 등록 거부)
            </label>

            <div className="md:col-span-2">
              <Button type="submit" disabled={!hasSources}>
                등록 → 검수 페이지로 이동
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">등록된 문서 ({docs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="py-4 text-center text-sm text-[color:var(--color-muted-foreground)]">
              아직 문서가 없습니다.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-[color:var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--color-muted)] text-xs uppercase text-[color:var(--color-muted-foreground)]">
                  <tr>
                    <th className="px-3 py-2 text-left">제목</th>
                    <th className="px-3 py-2 text-left">상태 / 깊이</th>
                    <th className="px-3 py-2 text-left">Region</th>
                    <th className="px-3 py-2 text-left">업데이트</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id} className="border-t border-[color:var(--color-border)]">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/admin/documents/${doc.id}/review`}
                          className="font-medium hover:text-[color:var(--color-primary)]"
                        >
                          {doc.title_ko || doc.title}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">{doc.status}</Badge>
                          <span className="text-xs text-[color:var(--color-muted-foreground)]">
                            {DEPTH_STAGE_LABELS[doc.depth_stage]} → {DEPTH_STAGE_LABELS[doc.target_depth_stage]}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{REGION_LABELS[doc.region]}</td>
                      <td className="px-3 py-2.5 text-xs text-[color:var(--color-muted-foreground)]">
                        {relativeTimeKR(doc.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
