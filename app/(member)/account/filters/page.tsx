import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireActiveMember } from "@/lib/supabase/member-guard";
import { deleteFilter } from "@/lib/actions/member";
import { relativeTimeKR } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "저장한 필터" };

interface SavedFilterRow {
  id: string;
  name: string;
  filter_json: Record<string, string>;
  created_at: string;
}

export default async function FiltersPage() {
  const ctx = await requireActiveMember();
  const { data } = await ctx.supabase
    .from("aik_saved_filters")
    .select("id, name, filter_json, created_at")
    .eq("member_id", ctx.member.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as SavedFilterRow[];

  function buildHref(filterJson: Record<string, string>): string {
    const qs = Object.entries(filterJson)
      .filter(([, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return qs ? `/library?${qs}` : "/library";
  }

  return (
    <div>
      <p className="mb-4 text-sm text-[color:var(--color-muted-foreground)]">
        라이브러리 필터 조합을 저장해 두면 한 번에 다시 적용할 수 있습니다.
      </p>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
            저장한 필터가 없습니다. <br />
            <Link href="/library" className="mt-2 inline-block text-[color:var(--color-primary)] hover:underline">
              라이브러리에서 필터를 적용한 뒤 저장 →
            </Link>
            <p className="mt-3 text-xs">
              (필터 저장 UI는 다음 폴리시 단계에서 라이브러리 좌측 패널에 추가 예정.<br />
              현재는 SQL/관리자 콘솔에서 수동 등록 가능)
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((f) => (
            <li key={f.id} className="rounded-md border border-[color:var(--color-border)] bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={buildHref(f.filter_json)}
                    className="font-medium hover:text-[color:var(--color-primary)]"
                  >
                    {f.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-[color:var(--color-muted-foreground)]">
                    {Object.entries(f.filter_json)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ") || "(빈 필터)"}
                  </p>
                  <p className="text-xs text-[color:var(--color-muted-foreground)]">
                    {relativeTimeKR(f.created_at)} 저장
                  </p>
                </div>
                <form action={deleteFilter}>
                  <input type="hidden" name="filter_id" value={f.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="text-[color:var(--color-destructive)]"
                  >
                    삭제
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
