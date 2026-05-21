import Link from "next/link";
import { getActiveMember } from "@/lib/supabase/member-guard";
import { createClient } from "@/lib/supabase/server";
import { signOutMember } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

/**
 * Header-mounted account widget.
 *   - signed out: "로그인" link
 *   - signed in but not active member: badge + signout
 *   - active member: display_name + dropdown to /account, signout
 */
export async function AccountMenu() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
        <Link href="/auth/login">로그인</Link>
      </Button>
    );
  }

  const active = await getActiveMember();

  if (!active) {
    // Authenticated but pending/rejected — surface status link
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/auth/pending"
          className="rounded-sm bg-[color:var(--color-accent)]/15 px-2 py-1 text-xs font-semibold text-[color:var(--color-accent)] hover:opacity-90"
        >
          승인 대기
        </Link>
        <form action={signOutMember}>
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Link
        href="/account/bookmarks"
        className="rounded-md border border-[color:var(--color-border)] px-2.5 py-1 text-xs hover:bg-[color:var(--color-muted)]"
        title={active.member.email}
      >
        <span className="font-medium">{active.member.display_name}</span>
      </Link>
      <form action={signOutMember}>
        <Button type="submit" variant="ghost" size="sm">
          로그아웃
        </Button>
      </form>
    </div>
  );
}
