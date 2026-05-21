import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signInMember } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "회원 로그인",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const errorMessage = (() => {
    if (!error) return null;
    if (error === "no_member")
      return "이 계정은 아직 회원 신청이 완료되지 않았습니다. 가입 신청을 진행해 주세요.";
    return error;
  })();

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">회원 로그인</CardTitle>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Actuarial Intel Korea
          </p>
        </CardHeader>
        <CardContent>
          <form action={signInMember} className="space-y-3">
            <input type="hidden" name="next" defaultValue={next ?? "/"} />
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold">이메일</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold">비밀번호</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
              />
            </label>
            {errorMessage ? (
              <p className="rounded-sm bg-[color:var(--color-destructive)]/10 px-2 py-1.5 text-xs text-[color:var(--color-destructive)]">
                {errorMessage}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              로그인
            </Button>
            <p className="text-center text-xs">
              아직 회원이 아니신가요?{" "}
              <Link href="/auth/signup" className="text-[color:var(--color-primary)] hover:underline">
                가입 신청
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      <div className="mt-6 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/40 p-4 text-xs text-[color:var(--color-muted-foreground)]">
        관리자이신가요?{" "}
        <Link href="/admin/login" className="text-[color:var(--color-primary)] hover:underline">
          관리자 콘솔 →
        </Link>
      </div>
    </div>
  );
}
