import { DocumentGridSkeleton } from "@/components/library/DocumentCardSkeleton";

export default function Loading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <div className="h-6 w-32 animate-pulse rounded bg-[color:var(--color-muted)]" />
        <div className="mt-2 h-4 w-20 animate-pulse rounded bg-[color:var(--color-muted)]" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-[color:var(--color-muted)]" />
          ))}
        </div>
      </aside>
      <DocumentGridSkeleton count={9} />
    </div>
  );
}
