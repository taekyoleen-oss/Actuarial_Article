import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  // requireAdmin in the protected layout verifies aik_admin_users on the next request.
  redirect(next);
}

export default async function AdminLoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const errorMessage = (() => {
    if (!error) return null;
    if (error === "not_admin") return "이 계정은 관리자 권한이 없습니다.";
    if (error === "missing") return "이메일과 비밀번호를 모두 입력하세요.";
    return error;
  })();

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">관리자 로그인</CardTitle>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Actuarial Intel Korea · admin console
          </p>
        </CardHeader>
        <CardContent>
          <form action={signIn} className="space-y-3">
            <input type="hidden" name="next" defaultValue={next ?? "/admin"} />
            <div>
              <label htmlFor="email" className="text-xs font-semibold">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-semibold">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
              />
            </div>
            {errorMessage ? (
              <p className="rounded-sm bg-[color:var(--color-destructive)]/10 px-2 py-1.5 text-xs text-[color:var(--color-destructive)]">
                {errorMessage}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="absolute bottom-4 text-xs text-[color:var(--color-muted-foreground)]">
        <Link href="/">← 공개 사이트로 돌아가기</Link>
      </p>
    </div>
  );
}
