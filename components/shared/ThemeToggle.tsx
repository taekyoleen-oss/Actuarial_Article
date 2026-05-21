"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a placeholder of the same size to avoid layout shift; aria-hidden so SR ignores it.
    return <span aria-hidden className="inline-block h-9 w-9" />;
  }

  const active = theme === "system" ? systemTheme : theme;
  const next = active === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={active === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      onClick={() => setTheme(next)}
    >
      {active === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
