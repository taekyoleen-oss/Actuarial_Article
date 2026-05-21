"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Users,
  Database,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ readonly className?: string }>;
  readonly badge?: number;
}

const items: ReadonlyArray<NavItem> = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/sources", label: "소스 관리", icon: Database },
  { href: "/admin/documents", label: "문서 관리", icon: FileText },
  { href: "/admin/discovery", label: "자동 수집 큐", icon: Compass },
  { href: "/admin/glossary", label: "용어 사전", icon: BookOpen },
  { href: "/admin/members", label: "회원 관리", icon: Users },
  { href: "/admin/feedback", label: "피드백", icon: MessageSquare },
];

interface AdminSidebarProps {
  readonly notificationCount?: number;
  readonly adminEmail?: string;
}

export function AdminSidebar({ notificationCount, adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-[color:var(--color-border)] bg-white md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-[color:var(--color-border)] px-4">
        <span className="rounded-sm bg-[color:var(--color-primary)] px-1.5 py-0.5 text-[11px] text-[color:var(--color-primary-foreground)]">
          AIK
        </span>
        <span className="font-serif text-sm font-semibold">관리자 콘솔</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-4 text-sm">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-sm px-3 py-2 transition-colors",
                active
                  ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]"
                  : "text-[color:var(--color-foreground)] hover:bg-[color:var(--color-muted)]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin" && notificationCount && notificationCount > 0 ? (
                <span className="rounded-full bg-[color:var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--color-accent-foreground)]">
                  {notificationCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[color:var(--color-border)] px-3 py-3 text-xs">
        <p className="truncate text-[color:var(--color-muted-foreground)]" title={adminEmail}>
          {adminEmail ?? "관리자"}
        </p>
        <form action="/api/admin/auth/logout" method="post">
          <button
            type="submit"
            className="mt-1.5 flex items-center gap-1.5 text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
          >
            <LogOut className="h-3 w-3" />
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminMobileNotice() {
  return (
    <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-muted)]/40 px-4 py-2 text-xs text-[color:var(--color-muted-foreground)] md:hidden">
      관리자 페이지는 데스크톱에 최적화되어 있습니다. 모바일에서는 큐 조회만 권장합니다.
    </div>
  );
}

export { Inbox };
