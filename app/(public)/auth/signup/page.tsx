import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signUpMember } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "회원 가입",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">회원 가입</CardTitle>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            번역 본문 전문·책갈피·필터 저장을 사용하려면 회원 가입 후 관리자 승인이 필요합니다.
          </p>
        </CardHeader>
        <CardContent>
          <form action={signUpMember} className="space-y-3">
            <Field label="이메일" name="email" type="email" required autoComplete="email" />
            <Field label="이름 (실명 권장)" name="display_name" required autoComplete="name" />
            <Field
              label="비밀번호 (8자 이상)"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            {error ? (
              <p className="rounded-sm bg-[color:var(--color-destructive)]/10 px-2 py-1.5 text-xs text-[color:var(--color-destructive)]">
                {error}
              </p>
            ) : null}
            <p className="text-xs text-[color:var(--color-muted-foreground)]">
              가입 신청 후 관리자 검토를 거쳐 영업일 5일 이내 활성화됩니다. 보험사·재보험사·KIRI·감독원·계리법인·학교 도메인은 우선 검토됩니다.
            </p>
            <Button type="submit" className="w-full">
              가입 신청
            </Button>
            <p className="text-center text-xs">
              이미 회원이신가요?{" "}
              <Link href="/auth/login" className="text-[color:var(--color-primary)] hover:underline">
                로그인
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  ...rest
}: {
  readonly label: string;
  readonly name: string;
  readonly type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
        {...rest}
      />
    </label>
  );
}
