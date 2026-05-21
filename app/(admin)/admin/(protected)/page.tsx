import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, listAdminDocuments } from "@/lib/supabase/queries/admin";
import { DEPTH_STAGE_LABELS } from "@/types/domain";
import { relativeTimeKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "관리자 대시보드" };

export default async function AdminDashboardPage() {
  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;
  let recent: Awaited<ReturnType<typeof listAdminDocuments>> = [];
  try {
    stats = await getDashboardStats();
    recent = await listAdminDocuments({ limit: 8 });
  } catch {
    // Supabase not yet linked — show shell.
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">대시보드</h1>
          <p className="text-sm text-[color:var(--color-muted-foreground)]">
            큐·검수·게시 상태 한눈에 보기
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/documents">새 문서 등록 →</Link>
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[color:var(--color-muted-foreground)]">
              게시 자료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-3xl">{stats?.publishedTotal ?? 0}</p>
            <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">총 published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[color:var(--color-muted-foreground)]">
              검수 대기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-3xl">{stats?.reviewPending ?? 0}</p>
            <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
              review_pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[color:var(--color-muted-foreground)]">
              파이프라인 큐
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-3xl">{stats?.queueLength ?? 0}</p>
            <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">진행·대기</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[color:var(--color-muted-foreground)]">
              미읽음 알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-3xl">{stats?.unreadNotifications ?? 0}</p>
            <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
              파이프라인·시스템
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg">깊이 단계 분포</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {(Object.keys(DEPTH_STAGE_LABELS) as Array<keyof typeof DEPTH_STAGE_LABELS>).map(
            (stage) => (
              <Card key={stage}>
                <CardContent className="py-4">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
                    {DEPTH_STAGE_LABELS[stage]}
                  </p>
                  <p className="mt-1 font-serif text-2xl">{stats?.byDepth[stage] ?? 0}</p>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg">최근 문서</h2>
          <Link
            href="/admin/documents"
            className="text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
          >
            전체 보기 →
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
              아직 등록된 문서가 없습니다. 새 문서 등록으로 시작하세요.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--color-muted)] text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
                <tr>
                  <th className="px-4 py-2 text-left">제목</th>
                  <th className="px-3 py-2 text-left">상태</th>
                  <th className="px-3 py-2 text-left">깊이</th>
                  <th className="px-3 py-2 text-left">업데이트</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((doc) => (
                  <tr key={doc.id} className="border-t border-[color:var(--color-border)]">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/documents/${doc.id}/review`}
                        className="font-medium hover:text-[color:var(--color-primary)]"
                      >
                        {doc.title_ko || doc.title}
                      </Link>
                      <p className="text-xs text-[color:var(--color-muted-foreground)]">
                        {doc.region === "domestic" ? "국내" : "해외"} · {doc.track}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline">{doc.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {DEPTH_STAGE_LABELS[doc.depth_stage]} → {DEPTH_STAGE_LABELS[doc.target_depth_stage]}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[color:var(--color-muted-foreground)]">
                      {relativeTimeKR(doc.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
