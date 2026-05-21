import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "자동 수집 큐 — 관리자" };

export default async function AdminDiscoveryPage() {
  let runs: ReadonlyArray<{
    id: string;
    source_id: string;
    started_at: string;
    finished_at: string | null;
    candidates_found: number;
    candidates_new: number;
    status: string;
    error_message: string | null;
  }> = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("aik_discovery_runs")
      .select("id, source_id, started_at, finished_at, candidates_found, candidates_new, status, error_message")
      .order("started_at", { ascending: false })
      .limit(50);
    runs = (data ?? []) as typeof runs;
  } catch {
    runs = [];
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">자동 수집 큐</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          M2 마일스톤에서 활성화. 현재는 마이그레이션 테이블만 준비됨.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">실행 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[color:var(--color-muted-foreground)]">
              아직 자동 수집 실행 이력이 없습니다. M2에서 cron 스케줄러가 활성화됩니다.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-[color:var(--color-muted-foreground)]">
                <tr>
                  <th className="py-2 text-left">시작</th>
                  <th className="py-2 text-left">상태</th>
                  <th className="py-2 text-right">발견</th>
                  <th className="py-2 text-right">신규</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-t border-[color:var(--color-border)]">
                    <td className="py-2 text-xs">{new Date(r.started_at).toLocaleString("ko-KR")}</td>
                    <td className="py-2 text-xs">{r.status}</td>
                    <td className="py-2 text-right text-xs">{r.candidates_found}</td>
                    <td className="py-2 text-right text-xs">{r.candidates_new}</td>
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
