import { listAdminSources } from "@/lib/supabase/queries/admin";
import { createSource, deleteSource } from "@/lib/actions/sources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  QUOTATION_POLICIES,
  REGIONS,
  REGION_LABELS,
  TRACKS,
} from "@/types/domain";

export const dynamic = "force-dynamic";

export const metadata = { title: "소스 관리 — 관리자" };

export default async function AdminSourcesPage() {
  let sources: Awaited<ReturnType<typeof listAdminSources>> = [];
  try {
    sources = await listAdminSources();
  } catch {
    sources = [];
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">소스 관리</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          수집 소스의 region·track·인용 정책·자동 수집 스케줄을 관리합니다.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 소스 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSource} className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">소스 명</span>
              <input
                name="name"
                required
                placeholder="SOA Mortality Research"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">발행 기관</span>
              <input
                name="organization"
                required
                placeholder="Society of Actuaries"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-semibold">Base URL</span>
              <input
                name="base_url"
                type="url"
                required
                placeholder="https://www.soa.org/resources/research-reports/"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 font-mono text-xs"
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
              <span className="mb-1 block text-xs font-semibold">인용 정책</span>
              <select
                name="quotation_policy"
                defaultValue="metadata_only"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2"
              >
                {QUOTATION_POLICIES.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold">
                자동 수집 cron (선택)
              </span>
              <input
                name="auto_crawl_schedule"
                placeholder="0 0 * * 1"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_reputable" />
              저명 기관 (자동 수집 대상)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="members_only_default" />
              Members-only 기본 (게재 금지 트리거)
            </label>
            <div className="md:col-span-2">
              <Button type="submit">소스 추가</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">등록된 소스 ({sources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <p className="py-4 text-center text-sm text-[color:var(--color-muted-foreground)]">
              등록된 소스가 없습니다.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-[color:var(--color-muted-foreground)]">
                <tr>
                  <th className="py-2 text-left">소스</th>
                  <th className="py-2 text-left">Region</th>
                  <th className="py-2 text-left">Track</th>
                  <th className="py-2 text-left">인용 정책</th>
                  <th className="py-2 text-left">자동 수집</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} className="border-t border-[color:var(--color-border)]">
                    <td className="py-2.5">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-[color:var(--color-muted-foreground)]">
                        {s.organization}
                      </p>
                    </td>
                    <td className="py-2.5 text-xs">{REGION_LABELS[s.region]}</td>
                    <td className="py-2.5 text-xs">
                      <Badge variant="outline">{s.track}</Badge>
                      {s.is_reputable ? (
                        <Badge variant="accent" className="ml-1">
                          저명
                        </Badge>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-xs">{s.quotation_policy}</td>
                    <td className="py-2.5 text-xs font-mono">
                      {s.auto_crawl_schedule || "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      <form action={deleteSource.bind(null, s.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-[color:var(--color-destructive)]"
                        >
                          삭제
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
