import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireActiveMember } from "@/lib/supabase/member-guard";
import { signOutMember } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "계정 설정" };

export default async function AccountSettingsPage() {
  const ctx = await requireActiveMember();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">계정 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm sm:grid-cols-[120px_1fr]">
            <dt className="text-[color:var(--color-muted-foreground)]">이메일</dt>
            <dd>{ctx.member.email}</dd>
            <dt className="text-[color:var(--color-muted-foreground)]">표시 이름</dt>
            <dd>{ctx.member.display_name}</dd>
            <dt className="text-[color:var(--color-muted-foreground)]">도메인 분류</dt>
            <dd>
              {ctx.member.domain_classification === "whitelist"
                ? "화이트리스트"
                : ctx.member.domain_classification === "blocked"
                  ? "차단"
                  : "일반"}
            </dd>
            <dt className="text-[color:var(--color-muted-foreground)]">상태</dt>
            <dd>활성</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">비밀번호 재설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[color:var(--color-muted-foreground)]">
          <p>
            현재는 Supabase Auth 기본 비밀번호 재설정 메일을 통해서만 가능합니다.
            인증 메일에서 받은 링크를 따라 재설정하세요.
          </p>
          <p className="text-xs">
            (인앱 재설정 UI는 다음 폴리시 단계에서 추가 예정)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">세션</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signOutMember}>
            <Button type="submit" variant="outline">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
