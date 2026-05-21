"use client";

import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Compass, FileText, Home, Search, Tag } from "lucide-react";
import {
  BUSINESS_AREAS,
  BUSINESS_AREA_LABELS,
  PRIMARY_TOPICS,
  PRIMARY_TOPIC_LABELS,
} from "@/types/domain";

interface DocResult {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly title_ko: string | null;
}

interface TermResult {
  readonly id: string;
  readonly term_en: string;
  readonly term_ko_standard: string;
}

/**
 * Global ⌘K palette. Groups results in 4 sections per §5라운드 결정:
 *   Documents · Topics · Glossary · Commands
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [docs, setDocs] = useState<ReadonlyArray<DocResult>>([]);
  const [terms, setTerms] = useState<ReadonlyArray<TermResult>>([]);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search against /api/public/search (implemented inline here for now).
  useEffect(() => {
    if (!open) return;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setDocs([]);
      setTerms([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/public/search?q=${encodeURIComponent(trimmed)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { documents: DocResult[]; terms: TermResult[] };
        setDocs(data.documents ?? []);
        setTerms(data.terms ?? []);
      } catch {
        /* aborted */
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  function goto(path: string) {
    setOpen(false);
    router.push(path);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] shadow-2xl"
      >
        <Command label="글로벌 검색" shouldFilter={false}>
          <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] px-3 py-2">
            <Search className="h-4 w-4 text-[color:var(--color-muted-foreground)]" />
            <Command.Input
              value={q}
              onValueChange={setQ}
              placeholder="자료 / 주제 / 용어 / 명령 검색…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--color-muted-foreground)]"
              autoFocus
            />
            <kbd className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-1.5 py-0.5 text-[10px] text-[color:var(--color-muted-foreground)]">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="p-6 text-center text-sm text-[color:var(--color-muted-foreground)]">
              {q.length < 2 ? "두 글자 이상 입력하세요." : "결과 없음"}
            </Command.Empty>

            {docs.length > 0 ? (
              <Command.Group heading="자료" className="mb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-[color:var(--color-muted-foreground)]">
                {docs.map((d) => (
                  <Command.Item
                    key={d.id}
                    value={`doc-${d.id}-${d.title_ko}-${d.title}`}
                    onSelect={() => goto(`/library/${d.slug}`)}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-[color:var(--color-muted)]"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]" />
                    <span className="flex-1 truncate">{d.title_ko || d.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            <Command.Group heading="주제 / 업무영역" className="mb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-[color:var(--color-muted-foreground)]">
              {PRIMARY_TOPICS.map((t) => (
                <Command.Item
                  key={`topic-${t}`}
                  value={`topic-${t}-${PRIMARY_TOPIC_LABELS[t]}`}
                  onSelect={() => goto(`/topics/${t}`)}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-[color:var(--color-muted)]"
                >
                  <Tag className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]" />
                  <span>주제: {PRIMARY_TOPIC_LABELS[t]}</span>
                </Command.Item>
              ))}
              {BUSINESS_AREAS.map((a) => (
                <Command.Item
                  key={`area-${a}`}
                  value={`area-${a}-${BUSINESS_AREA_LABELS[a]}`}
                  onSelect={() => goto(`/business-area/${a}`)}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-[color:var(--color-muted)]"
                >
                  <Compass className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]" />
                  <span>업무영역: {BUSINESS_AREA_LABELS[a]}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {terms.length > 0 ? (
              <Command.Group heading="용어" className="mb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-[color:var(--color-muted-foreground)]">
                {terms.map((t) => (
                  <Command.Item
                    key={t.id}
                    value={`term-${t.id}-${t.term_en}-${t.term_ko_standard}`}
                    onSelect={() => goto(`/glossary?q=${encodeURIComponent(t.term_en)}`)}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-[color:var(--color-muted)]"
                  >
                    <BookOpen className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]" />
                    <span className="flex-1">
                      {t.term_en} → <span className="text-[color:var(--color-primary)]">{t.term_ko_standard}</span>
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            <Command.Group heading="명령" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-[color:var(--color-muted-foreground)]">
              <Command.Item
                value="go-library"
                onSelect={() => goto("/library")}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-[color:var(--color-muted)]"
              >
                <Home className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]" />
                라이브러리 전체 보기
              </Command.Item>
              <Command.Item
                value="go-glossary"
                onSelect={() => goto("/glossary")}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-[color:var(--color-muted)]"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]" />
                용어 사전 열기
              </Command.Item>
              <Command.Item
                value="go-data"
                onSelect={() => goto("/data-catalog")}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-[color:var(--color-muted)]"
              >
                <Compass className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]" />
                국내 데이터 카탈로그
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-3 py-2 text-[10px] text-[color:var(--color-muted-foreground)]">
            <span>↑↓ 이동 · Enter 선택</span>
            <span>⌘K / Ctrl+K 다시 열기</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
