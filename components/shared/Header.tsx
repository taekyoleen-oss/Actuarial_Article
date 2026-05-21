import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import { CommandHintButton } from "./CommandHintButton";
import { AccountMenu } from "./AccountMenu";

const navItems: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/library", label: "라이브러리" },
  { href: "/topics/mortality", label: "주제" },
  { href: "/business-area/product_development", label: "업무영역" },
  { href: "/data-catalog", label: "데이터" },
  { href: "/glossary", label: "용어" },
  { href: "/about", label: "소개" },
];

export async function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-base font-semibold">
          <span className="rounded-sm bg-[color:var(--color-primary)] px-1.5 py-0.5 text-[11px] text-[color:var(--color-primary-foreground)]">
            AIK
          </span>
          <span className="hidden md:inline">Actuarial Intel Korea</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[color:var(--color-muted-foreground)] transition-colors hover:text-[color:var(--color-foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CommandHintButton />
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>
      <CommandPalette />
    </header>
  );
}
