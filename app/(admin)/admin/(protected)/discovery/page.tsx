import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { listAdminSources } from "@/lib/supabase/queries/admin";
import {
  approveCandidate,
  rejectCandidate,
  triggerDiscoveryNow,
} from "@/lib/actions/discovery";
import { relativeTimeKR } from "@/lib/utils";
import { REGION_LABELS } from "@/types/domain";

export const dynamic = "force-dynamic";
export const metadata = { title: "자동 수집 큐 — 관리자" };

interface CandidateRow {
  id: string;
  title: string;
  title_ko: string | null;
  original_url: string;
  source_id: string;
  region: "overseas" | "domestic";
  published_at: string | null;
  fetched_at: string | null;
  created_at: string;
}

interface DiscoveryRunRow {
  id: string;
  source_id: string;
  started_at: string;
  finished_at: string | null;
  candidates_found: number;
  candidates_new: number;
  status: "success" | "partial" | "failed";
  error_message: string | null;
}

async function runDiscoveryFormAction(formData: FormData): Promise<void> {
  "use server";
  const sourceId = formData.get("source_id")?.toString() ?? "all";
  await triggerDiscoveryNow(sourceId);
}

async function approveFormAction(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("document_id"));
  const depth = String(formData.get("target_depth")) as
    | "summarized"
    | "translated"
    | "interpreted";
  await approveCandidate(id, depth);
}

async function rejectFormAction(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("document_id"));
  await rejectCandidate(id, "관리자 거절");
}

export default async function AdminDiscoveryPage() {
  let candidates: CandidateRow[] = [];
  let runs: DiscoveryRunRow[] = [];
  let sources: Awaited<ReturnType<typeof listAdminSources>> = [];

  try {
    const supabase = await createClient();
    const [candidatesRes, runsRes, sourcesData] = await Promise.all([
      supabase
        .from("aik_documents")
        .select(
          "id, title, title_ko, original_url, source_id, region, published_at, fetched_at, created_at",
        )
        .eq("track", "auto_discovery")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("aik_discovery_runs")
        .select(
          "id, source_id, started_at, finished_at, candidates_found, candidates_new, status, error_message",
        )
        .order("started_at", { ascending: false })
        .limit(20),
      listAdminSources(),
    ]);
    candidates = (candidatesRes.data ?? []) as unknown as CandidateRow[];
    runs = (runsRes.data ?? []) as unknown as DiscoveryRunRow[];
    sources = sourcesData;
  } catch {
    candidates = [];
    runs = [];
    sources = [];
  }

  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const autoSources = sources.filter(
    (s) => s.track === "auto_discovery" && s.is_reputable,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">자동 수집 큐</h1>
          <p className="text-sm text-[color:var(--color-muted-foreground)]">
            저명 기관 자동 수집 후보 + 실행 이력. Vercel Cron이 주 1회 자동 호출.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">즉시 실행</CardTitle>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            track=auto_discovery + is_reputable 소스만 대상. {autoSources.length}개 등록됨.
          </p>
        </CardHeader>
        <CardContent>
          {autoSources.length === 0 ? (
            <p className="py-2 text-sm text-[color:var(--color-muted-foreground)]">
              자동 수집 대상 소스가 없습니다.{" "}
              <Link href="/admin/sources" className="underline">
                소스 관리
              </Link>
              에서 <code>track=auto_discovery</code> + <code>저명 기관</code>으로 등록하세요.
            </p>
          ) : (
            <form action={runDiscoveryFormAction} className="flex flex-wrap gap-3">
              <select
                name="source_id"
                defaultValue="all"
                className="rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm"
              >
                <option value="all">전체 자동 수집 소스</option>
                {autoSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button type="submit">지금 실행</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">승인 대기 후보 ({candidates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <p className="py-4 text-center text-sm text-[color:var(--color-muted-foreground)]">
              승인 대기 중인 자동 수집 후보가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => {
                const src = sourceById.get(c.source_id);
                return (
                  <div
                    key={c.id}
                    className="rounded-md border border-[color:var(--color-border)] bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium" title={c.title}>
                          {c.title_ko || c.title}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[color:var(--color-muted-foreground)]">
                          <Badge variant="outline">{REGION_LABELS[c.region]}</Badge>
                          <span>{src?.name ?? "(소스?)"}</span>
                          <span>·</span>
                          <span>{relativeTimeKR(c.created_at)} 발견</span>
                          {c.published_at ? (
                            <>
                              <span>·</span>
                              <span>발행 {c.published_at}</span>
                            </>
                          ) : null}
                        </p>
                        <a
                          href={c.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block truncate text-xs text-[color:var(--color-primary)] hover:underline"
                        >
                          {c.original_url}
                        </a>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <form action={approveFormAction}>
                          <input type="hidden" name="document_id" value={c.id} />
                          <input type="hidden" name="target_depth" value="summarized" />
                          <Button type="submit" size="sm" variant="outline" title="요약까지">
                            요약
                          </Button>
                        </form>
                        <form action={approveFormAction}>
                          <input type="hidden" name="document_id" value={c.id} />
                          <input type="hidden" name="target_depth" value="translated" />
                          <Button type="submit" size="sm" variant="outline" title="번역까지">
                            번역
                          </Button>
                        </form>
                        <form action={approveFormAction}>
                          <input type="hidden" name="document_id" value={c.id} />
                          <input type="hidden" name="target_depth" value="interpreted" />
                          <Button type="submit" size="sm" title="해석까지">
                            해석
                          </Button>
                        </form>
                        <form action={rejectFormAction}>
                          <input type="hidden" name="document_id" value={c.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="text-[color:var(--color-destructive)]"
                          >
                            거절
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 실행 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="py-4 text-center text-sm text-[color:var(--color-muted-foreground)]">
              실행 이력이 없습니다. 위 "지금 실행" 또는 cron 트리거 후 표시됩니다.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-[color:var(--color-muted-foreground)]">
                <tr>
                  <th className="py-2 text-left">소스</th>
                  <th className="py-2 text-left">시작</th>
                  <th className="py-2 text-left">상태</th>
                  <th className="py-2 text-right">발견</th>
                  <th className="py-2 text-right">신규</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const src = sourceById.get(r.source_id);
                  return (
                    <tr key={r.id} className="border-t border-[color:var(--color-border)]">
                      <td className="py-2 text-xs">{src?.name ?? "(?)"}</td>
                      <td className="py-2 text-xs">
                        {new Date(r.started_at).toLocaleString("ko-KR")}
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={
                            r.status === "failed"
                              ? "outline"
                              : r.status === "success"
                                ? "primary"
                                : "accent"
                          }
                        >
                          {r.status}
                        </Badge>
                        {r.error_message ? (
                          <span
                            className="ml-2 text-xs text-[color:var(--color-destructive)]"
                            title={r.error_message}
                          >
                            {r.error_message.slice(0, 40)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 text-right text-xs">{r.candidates_found}</td>
                      <td className="py-2 text-right text-xs">{r.candidates_new}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
