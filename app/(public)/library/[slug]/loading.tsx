export default function Loading() {
  return (
    <article className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <div className="space-y-8">
        <header className="space-y-3 border-b border-[color:var(--color-border)] pb-6">
          <div className="flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded bg-[color:var(--color-muted)]" />
            <div className="h-5 w-20 animate-pulse rounded bg-[color:var(--color-muted)]" />
            <div className="h-5 w-24 animate-pulse rounded bg-[color:var(--color-muted)]" />
          </div>
          <div className="h-10 w-3/4 animate-pulse rounded bg-[color:var(--color-muted)]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[color:var(--color-muted)]" />
        </header>
        <div className="space-y-3 rounded-md border-2 border-[color:var(--color-primary)]/20 bg-[color:var(--color-muted)]/30 p-6">
          <div className="h-5 w-1/3 animate-pulse rounded bg-[color:var(--color-muted)]" />
          <div className="h-3 w-full animate-pulse rounded bg-[color:var(--color-muted)]" />
          <div className="h-3 w-full animate-pulse rounded bg-[color:var(--color-muted)]" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-[color:var(--color-muted)]" />
        </div>
      </div>
      <aside>
        <div className="rounded-md border border-[color:var(--color-border)] p-4">
          <div className="h-4 w-24 animate-pulse rounded bg-[color:var(--color-muted)]" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-[color:var(--color-muted)]" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-[color:var(--color-muted)]" />
          </div>
        </div>
      </aside>
    </article>
  );
}
