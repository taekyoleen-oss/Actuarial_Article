import "../globals.css";

export const dynamic = "force-dynamic";

/**
 * Admin layout forces the light theme (per §4.4 — admin stays light).
 * The HTML root has suppressHydrationWarning + ThemeProvider in app/layout.tsx;
 * we add `class="light"` here to override any dark preference within this group.
 */
export default function AdminRootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <div className="light min-h-screen bg-[color:var(--color-background)]">{children}</div>;
}
