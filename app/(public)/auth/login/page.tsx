import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "회원 로그인",
  robots: { index: false, follow: false },
};

/**
 * Stub for M1 — member sign-up/login activates in M3 (per 부록 A 마일스톤).
 * Provides a clean path for admins to reach /admin/login.
 */
export default function MemberLoginStubPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">회원 로그인</CardTitle>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Actuarial Intel Korea
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/40 p-4 text-sm">
            <p className="font-semibold">회원 가입은 곧 활성화됩니다.</p>
            <p className="mt-1 text-[color:var(--color-muted-foreground)]">
              본 플랫폼은 현재 <strong>공개 읽기(M1)</strong> 단계입니다. 회원 가입·번역 본문
              전문 열람·책갈피·도입 등급 필터 저장 기능은 다음 단계(M3)에서 공개됩니다.
              지금은 자료 메타·요약·한국형 해석을 비회원도 자유롭게 열람할 수 있습니다.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">지금 할 수 있는 것</p>
            <ul className="list-disc space-y-1 pl-5 text-[color:var(--color-muted-foreground)]">
              <li>
                <Link href="/library" className="text-[color:var(--color-primary)] hover:underline">
                  라이브러리
                </Link>
                에서 큐레이션된 자료 열람
              </li>
              <li>
                <Link href="/glossary" className="text-[color:var(--color-primary)] hover:underline">
                  용어 사전
                </Link>{" "}
                검색
              </li>
              <li>
                <Link
                  href="/data-catalog"
                  className="text-[color:var(--color-primary)] hover:underline"
                >
                  국내 데이터 카탈로그
                </Link>{" "}
                참조
              </li>
              <li>
                자료 제안: about 페이지의 이메일·외부 양식 채널
              </li>
            </ul>
          </div>

          <div className="space-y-2 border-t border-[color:var(--color-border)] pt-4 text-sm">
            <p className="font-semibold">관리자이신가요?</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/login">관리자 콘솔로 이동 →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
