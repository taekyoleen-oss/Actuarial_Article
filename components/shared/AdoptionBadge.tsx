import {
  ADOPTION_GRADE_ICONS,
  ADOPTION_GRADE_LABELS,
  type AdoptionGrade,
} from "@/types/domain";
import { cn } from "@/lib/utils";

const colorByGrade: Record<AdoptionGrade, string> = {
  immediate: "bg-[color:var(--color-grade-immediate)]/15 text-[color:var(--color-grade-immediate)] border-[color:var(--color-grade-immediate)]/30",
  pilot: "bg-[color:var(--color-grade-pilot)]/15 text-[color:var(--color-grade-pilot)] border-[color:var(--color-grade-pilot)]/30",
  internal_research:
    "bg-[color:var(--color-grade-research)]/15 text-[color:var(--color-grade-research)] border-[color:var(--color-grade-research)]/30",
  monitoring:
    "bg-[color:var(--color-grade-monitoring)]/15 text-[color:var(--color-muted-foreground)] border-[color:var(--color-grade-monitoring)]/30",
};

interface AdoptionBadgeProps {
  readonly grade: AdoptionGrade;
  readonly className?: string;
}

export function AdoptionBadge({ grade, className }: AdoptionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium",
        colorByGrade[grade],
        className,
      )}
      title={`도입 등급: ${ADOPTION_GRADE_LABELS[grade]}`}
    >
      <span aria-hidden>{ADOPTION_GRADE_ICONS[grade]}</span>
      <span>{ADOPTION_GRADE_LABELS[grade]}</span>
    </span>
  );
}
