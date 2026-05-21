"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Header-mounted ⌘K hint. Clicking dispatches a synthetic key event so the
 * already-registered CommandPalette listener opens.
 */
export function CommandHintButton() {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  function open() {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: mac,
      ctrlKey: !mac,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  return (
    <button
      type="button"
      onClick={open}
      className="hidden items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2.5 py-1 text-xs text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] md:inline-flex"
      aria-label="전체 검색 열기"
    >
      <Search className="h-3.5 w-3.5" />
      <span>검색</span>
      <kbd className="rounded border border-[color:var(--color-border)] px-1 py-0.5 text-[10px]">
        {mac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
