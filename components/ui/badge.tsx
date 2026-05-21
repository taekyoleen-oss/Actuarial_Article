import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--color-muted)] text-[color:var(--color-foreground)]",
        primary:
          "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]",
        accent:
          "bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]",
        outline:
          "border border-[color:var(--color-border)] bg-transparent text-[color:var(--color-foreground)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
