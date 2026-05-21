import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "회원 관리 — 관리자" };

export default function AdminMembersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">회원 관리</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          M3에서 활성화되는 화면입니다.
        </p>
      </header>
      <Card>
        <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
          회원 가입 흐름은 M3 마일스톤에서 공개됩니다. 그 전까지는 관리자가 Supabase 콘솔에서 직접
          <code className="mx-1 rounded bg-[color:var(--color-muted)] px-1.5 py-0.5">aik_members</code>·
          <code className="mx-1 rounded bg-[color:var(--color-muted)] px-1.5 py-0.5">aik_admin_users</code>를
          관리합니다.
        </CardContent>
      </Card>
    </div>
  );
}
