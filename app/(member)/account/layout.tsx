import Link from "next/link";
import { requireActiveMember } from "@/lib/supabase/member-guard";

export const dynamic = "force-dynamic";

const accountTabs = [
  { href: "/account/bookmarks", label: "책갈피" },
  { href: "/account/filters", label: "저장한 필터" },
  { href: "/account/settings", label: "계정 설정" },
] as const;

export default async function AccountLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const ctx = await requireActiveMember();
  return (
    <div className="space-y-6">
      <header className="border-b border-[color:var(--color-border)] pb-4">
        <p className="text-xs uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
          내 계정
        </p>
        <h1 className="font-serif text-2xl">{ctx.member.display_name}</h1>
        <p className="text-xs text-[color:var(--color-muted-foreground)]">{ctx.member.email}</p>
      </header>
      <nav className="flex gap-4 border-b border-[color:var(--color-border)] text-sm">
        {accountTabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="border-b-2 border-transparent py-2 text-[color:var(--color-muted-foreground)] transition-colors hover:text-[color:var(--color-foreground)] aria-[current=page]:border-[color:var(--color-primary)] aria-[current=page]:text-[color:var(--color-foreground)]"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
