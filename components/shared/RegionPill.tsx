import { REGION_LABELS, type Region } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RegionPillProps {
  readonly region: Region;
  readonly className?: string;
}

export function RegionPill({ region, className }: RegionPillProps) {
  const code = region === "overseas" ? "EN" : "KR";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-[color:var(--color-border)] bg-[color:var(--color-background)]/80 px-1.5 py-0.5 text-[10px] font-medium",
        className,
      )}
      title={REGION_LABELS[region]}
    >
      <span className="text-[color:var(--color-muted-foreground)]">{code}</span>
      <span>{REGION_LABELS[region]}</span>
    </span>
  );
}
