import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  approveMember,
  rejectMember,
  suspendMember,
  reactivateMember,
} from "@/lib/actions/admin-members";
import { formatDateKR, relativeTimeKR } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "회원 관리 — 관리자" };

interface MemberRow {
  id: string;
  email: string;
  display_name: string;
  status: "pending" | "active" | "rejected" | "suspended";
  domain_classification: "whitelist" | "other" | "blocked";
  created_at: string;
  approved_at: string | null;
  last_login_at: string | null;
}

export default async function AdminMembersPage() {
  let members: MemberRow[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("aik_members")
      .select(
        "id, email, display_name, status, domain_classification, created_at, approved_at, last_login_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    members = (data ?? []) as unknown as MemberRow[];
  } catch {
    members = [];
  }

  const pending = members.filter((m) => m.status === "pending");
  const active = members.filter((m) => m.status === "active");
  const others = members.filter((m) => m.status === "rejected" || m.status === "suspended");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">회원 관리</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          가입 신청자 승인·거절·정지. 도메인 화이트리스트 통과자는 우선 검토.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">승인 대기 ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="py-4 text-center text-sm text-[color:var(--color-muted-foreground)]">
              승인 대기 회원이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {pending.map((m) => (
                <PendingRow
                  key={m.id}
                  m={m}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">활성 회원 ({active.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="py-4 text-center text-sm text-[color:var(--color-muted-foreground)]">
              활성 회원이 없습니다.
            </p>
          ) : (
            <MemberTable rows={active} variant="active" />
          )}
        </CardContent>
      </Card>

      {others.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              거절·정지 ({others.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MemberTable rows={others} variant="others" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function PendingRow({ m }: { readonly m: MemberRow }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[color:var(--color-border)] bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{m.display_name}</p>
        <p className="text-xs text-[color:var(--color-muted-foreground)]">
          {m.email} ·{" "}
          <ClassificationBadge c={m.domain_classification} /> · 신청{" "}
          {relativeTimeKR(m.created_at)}
        </p>
      </div>
      <div className="flex gap-1">
        <form action={approveMember}>
          <input type="hidden" name="member_id" value={m.id} />
          <Button type="submit" size="sm">
            승인
          </Button>
        </form>
        <form action={rejectMember}>
          <input type="hidden" name="member_id" value={m.id} />
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
  );
}

function MemberTable({
  rows,
  variant,
}: {
  readonly rows: MemberRow[];
  readonly variant: "active" | "others";
}) {
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase text-[color:var(--color-muted-foreground)]">
        <tr>
          <th className="py-2 text-left">회원</th>
          <th className="py-2 text-left">상태</th>
          <th className="py-2 text-left">도메인</th>
          <th className="py-2 text-left">최근 로그인</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.id} className="border-t border-[color:var(--color-border)]">
            <td className="py-2.5">
              <p className="font-medium">{m.display_name}</p>
              <p className="text-xs text-[color:var(--color-muted-foreground)]">{m.email}</p>
            </td>
            <td className="py-2.5">
              <Badge variant={m.status === "active" ? "primary" : "outline"}>
                {m.status}
              </Badge>
              {m.approved_at ? (
                <p className="text-[10px] text-[color:var(--color-muted-foreground)]">
                  {formatDateKR(m.approved_at)} 승인
                </p>
              ) : null}
            </td>
            <td className="py-2.5 text-xs">
              <ClassificationBadge c={m.domain_classification} />
            </td>
            <td className="py-2.5 text-xs text-[color:var(--color-muted-foreground)]">
              {m.last_login_at ? relativeTimeKR(m.last_login_at) : "—"}
            </td>
            <td className="py-2.5 text-right">
              {variant === "active" ? (
                <form action={suspendMember}>
                  <input type="hidden" name="member_id" value={m.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    정지
                  </Button>
                </form>
              ) : (
                <form action={reactivateMember}>
                  <input type="hidden" name="member_id" value={m.id} />
                  <Button type="submit" size="sm" variant="outline">
                    재활성
                  </Button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ClassificationBadge({
  c,
}: {
  readonly c: "whitelist" | "other" | "blocked";
}) {
  if (c === "whitelist") return <Badge variant="accent">whitelist</Badge>;
  if (c === "blocked")
    return (
      <Badge variant="outline" className="text-[color:var(--color-destructive)]">
        blocked
      </Badge>
    );
  return <Badge variant="outline">other</Badge>;
}
