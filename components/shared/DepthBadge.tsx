import {
  DEPTH_STAGES,
  DEPTH_STAGE_LABELS,
  DEPTH_STAGE_ORDINAL,
  type DepthStage,
} from "@/types/domain";
import { cn } from "@/lib/utils";

interface DepthBadgeProps {
  readonly stage: DepthStage;
  readonly size?: "sm" | "md";
  readonly showLabel?: boolean;
  readonly className?: string;
}

/**
 * Visual indicator for §4.3: 4-dot depth indicator.
 *   ●○○○ registered  |  ●●○○ summarized  |  ●●●○ translated  |  ●●●● interpreted
 */
export function DepthBadge({
  stage,
  size = "sm",
  showLabel = false,
  className,
}: DepthBadgeProps) {
  const filled = DEPTH_STAGE_ORDINAL[stage];
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        showLabel && "rounded-sm bg-[color:var(--color-muted)] px-1.5 py-0.5",
        className,
      )}
      aria-label={`처리 깊이: ${DEPTH_STAGE_LABELS[stage]}`}
      title={`처리 깊이: ${DEPTH_STAGE_LABELS[stage]} (${filled}/4)`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {DEPTH_STAGES.map((s) => {
          const idx = DEPTH_STAGE_ORDINAL[s];
          const isFilled = idx <= filled;
          return (
            <span
              key={s}
              className={cn(
                "rounded-full",
                dotSize,
                isFilled
                  ? "bg-[color:var(--color-primary)]"
                  : "bg-[color:var(--color-border)]",
              )}
            />
          );
        })}
      </span>
      {showLabel ? (
        <span className="text-[10px] uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
          {DEPTH_STAGE_LABELS[stage]}
        </span>
      ) : null}
    </span>
  );
}
