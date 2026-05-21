import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "회원 가입",
  robots: { index: false, follow: false },
};

export default function SignupStubPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">회원 가입</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            회원 가입은 <strong>M3 단계</strong>에서 공개됩니다. 가입 시 이메일 도메인
            화이트리스트(보험사·KIRI·감독원·계리법인 등) + 관리자 승인 기반으로 운영됩니다.
          </p>
          <p className="text-[color:var(--color-muted-foreground)]">
            지금은 비회원 상태로 메타·요약·한국형 해석을 모두 열람할 수 있습니다.
            <br />
            <Link href="/library" className="text-[color:var(--color-primary)] hover:underline">
              라이브러리로 이동 →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
