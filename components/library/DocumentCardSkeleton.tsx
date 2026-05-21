import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DocumentCardSkeleton() {
  return (
    <Card className="relative">
      <CardHeader className="pt-12">
        <div className="h-5 w-3/4 animate-pulse rounded bg-[color:var(--color-muted)]" />
        <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-[color:var(--color-muted)]" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-[color:var(--color-muted)]" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-[color:var(--color-muted)]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[color:var(--color-muted)]" />
      </CardContent>
    </Card>
  );
}

export function DocumentGridSkeleton({ count = 6 }: { readonly count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}
