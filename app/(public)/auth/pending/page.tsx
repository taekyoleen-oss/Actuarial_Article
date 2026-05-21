import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "승인 대기",
  robots: { index: false, follow: false },
};

export default function PendingStubPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">승인 대기 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            가입 신청이 접수되면 관리자 검토 후 영업일 5일 이내 활성화됩니다. (M3에서 활성)
          </p>
          <p className="text-[color:var(--color-muted-foreground)]">
            <Link href="/" className="text-[color:var(--color-primary)] hover:underline">
              ← 메인으로
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
