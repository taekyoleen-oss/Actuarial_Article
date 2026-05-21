import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOutMember } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "승인 대기",
  robots: { index: false, follow: false },
};

interface MemberRow {
  email: string;
  display_name: string;
  status: "pending" | "active" | "rejected" | "suspended";
  domain_classification: string;
  created_at: string;
}

export default async function PendingPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let member: MemberRow | null = null;
  if (user) {
    const { data } = await supabase
      .from("aik_members")
      .select("email, display_name, status, domain_classification, created_at")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    member = (data as unknown as MemberRow) ?? null;
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">승인 대기 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {reason === "verify_email" ? (
            <p className="rounded-md bg-[color:var(--color-accent)]/15 px-3 py-2 text-xs">
              가입한 이메일로 인증 메일이 발송되었습니다. 메일 내 링크를 클릭한 뒤 다시 로그인해 주세요.
            </p>
          ) : null}

          {member ? (
            <div className="space-y-2">
              <p>
                <strong>{member.display_name}</strong> 님의 가입 신청이 접수되었습니다.
              </p>
              <dl className="space-y-1 rounded-md border border-[color:var(--color-border)] bg-white p-3 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[color:var(--color-muted-foreground)]">상태</dt>
                  <dd className="font-semibold">{statusLabel(member.status)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[color:var(--color-muted-foreground)]">도메인 분류</dt>
                  <dd>{classificationLabel(member.domain_classification)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[color:var(--color-muted-foreground)]">신청일</dt>
                  <dd>{new Date(member.created_at).toLocaleDateString("ko-KR")}</dd>
                </div>
              </dl>
              {member.status === "active" ? (
                <Button asChild className="w-full">
                  <Link href="/">활성화 완료 — 사이트로 →</Link>
                </Button>
              ) : member.status === "pending" ? (
                <p className="text-xs text-[color:var(--color-muted-foreground)]">
                  관리자가 검토 후 영업일 5일 이내 활성화됩니다.{" "}
                  도메인 분류가 <em>whitelist</em>인 경우 우선 검토됩니다.
                </p>
              ) : (
                <p className="text-xs text-[color:var(--color-destructive)]">
                  가입이 거절되었거나 정지되었습니다. 문의: about 페이지 참조.
                </p>
              )}
            </div>
          ) : (
            <p>
              먼저{" "}
              <Link href="/auth/login" className="text-[color:var(--color-primary)] hover:underline">
                로그인
              </Link>
              해 주세요. 로그인되지 않은 상태에서는 신청 상태를 확인할 수 없습니다.
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/library">라이브러리 둘러보기</Link>
            </Button>
            {user ? (
              <form action={signOutMember} className="flex-1">
                <Button type="submit" variant="ghost" className="w-full">
                  로그아웃
                </Button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function statusLabel(s: string) {
  return s === "active" ? "활성"
    : s === "pending" ? "승인 대기"
    : s === "rejected" ? "거절됨"
    : "정지됨";
}

function classificationLabel(c: string) {
  return c === "whitelist" ? "화이트리스트 (우선)"
    : c === "blocked" ? "차단됨"
    : "일반";
}
