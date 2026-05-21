import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "피드백 — 관리자" };

export default function AdminFeedbackPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">피드백</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          M3 회원 가입 활성화 이후 자료별 오류 신고가 이 큐로 들어옵니다.
        </p>
      </header>
      <Card>
        <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
          현재 회원 가입이 활성화되지 않았으므로 피드백 큐는 비어있습니다.
        </CardContent>
      </Card>
    </div>
  );
}
