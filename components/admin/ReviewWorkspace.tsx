"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DepthBadge } from "@/components/shared/DepthBadge";
import {
  DEPTH_STAGES,
  DEPTH_STAGE_LABELS,
  DEPTH_STAGE_ORDINAL,
  type DepthStage,
  type BusinessArea,
} from "@/types/domain";

interface ReviewWorkspaceProps {
  readonly documentId: string;
  readonly currentStage: DepthStage;
  readonly targetStage: DepthStage;
  readonly status: string;
  readonly translation: {
    readonly id: string;
    readonly version: number;
    readonly content_md: string;
    readonly glossary_match_rate: number | null;
  } | null;
  readonly interpretation: {
    readonly id: string;
    readonly summary_ko: string;
    readonly korea_applicability: string | null;
    readonly required_korea_data: string | null;
    readonly regulatory_impact: string | null;
    readonly target_departments: readonly BusinessArea[];
    readonly adoption_difficulty: string | null;
    readonly adoption_notes: string | null;
  } | null;
  readonly promote: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  readonly publish: (documentId: string) => Promise<{ ok: boolean; error?: string }>;
  readonly archive: (documentId: string) => Promise<{ ok: boolean; error?: string }>;
  readonly saveTranslation: (
    translationId: string,
    contentMd: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  readonly saveInterpretation: (
    interpretationId: string,
    patch: Record<string, unknown>,
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function ReviewWorkspace(props: ReviewWorkspaceProps) {
  const [isPending, startTransition] = useTransition();
  const [translationDraft, setTranslationDraft] = useState(
    props.translation?.content_md ?? "",
  );
  const [interpDraft, setInterpDraft] = useState(props.interpretation);
  const [sourcePaste, setSourcePaste] = useState("");
  const [streaming, setStreaming] = useState(false);
  const translationRef = useRef<HTMLTextAreaElement | null>(null);

  const nextStages = DEPTH_STAGES.filter(
    (s) => DEPTH_STAGE_ORDINAL[s] === DEPTH_STAGE_ORDINAL[props.currentStage] + 1,
  );

  // === Hotkeys: N(다음 의심) / A(승인=다음 단계) / R(재생성) / G(용어 사전) ===
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // ignore when typing in inputs/textareas
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "textarea" || tag === "input" || tag === "select") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "a":
          if (nextStages[0]) {
            e.preventDefault();
            triggerPromote(nextStages[0]);
          }
          break;
        case "r":
          e.preventDefault();
          regenerateSelection();
          break;
        case "g":
          e.preventDefault();
          window.open("/admin/glossary", "_blank");
          break;
        case "n":
          // Jump to next suspicious segment marker (◆) inside translation textarea
          e.preventDefault();
          jumpToNextSuspicious();
          break;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextStages, translationDraft, streaming]);

  function jumpToNextSuspicious() {
    const ta = translationRef.current;
    if (!ta) return;
    const text = translationDraft;
    const start = ta.selectionEnd ?? 0;
    const next = text.indexOf("◆", start);
    const idx = next === -1 ? text.indexOf("◆") : next;
    if (idx === -1) {
      toast.info("의심 마커(◆)가 본문에 없습니다. 첨자해 두면 점프할 수 있습니다.");
      return;
    }
    ta.focus();
    ta.setSelectionRange(idx, idx + 1);
  }

  async function regenerateSelection() {
    const ta = translationRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selection = translationDraft.slice(start, end);
    if (selection.length < 20) {
      toast.error("재생성할 단락을 20자 이상 선택하세요.");
      return;
    }
    setStreaming(true);
    try {
      const response = await fetch("/api/admin/translate/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: props.documentId,
          selection,
        }),
      });
      if (!response.ok || !response.body) {
        const errText = await response.text();
        toast.error(`재생성 실패: ${errText.slice(0, 120)}`);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let leftPart = translationDraft.slice(0, start);
      const rightPart = translationDraft.slice(end);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6)) as
              | { delta: string }
              | { done: true }
              | { error: string };
            if ("delta" in payload) {
              accumulated += payload.delta;
              setTranslationDraft(leftPart + accumulated + rightPart);
            } else if ("error" in payload) {
              toast.error(payload.error);
            }
          } catch {
            // ignore malformed SSE line
          }
        }
      }
      toast.success("재생성 완료. 검토 후 저장하세요.");
    } finally {
      setStreaming(false);
    }
  }

  function triggerPromote(to: DepthStage) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("document_id", props.documentId);
      fd.set("to_stage", to);
      if (sourcePaste.length > 100) fd.set("source_text_override", sourcePaste);
      const result = await props.promote(fd);
      if (result.ok) {
        toast.success(`${DEPTH_STAGE_LABELS[to]} 단계 처리 완료. 검수 후 다음 단계로 진행하세요.`);
      } else {
        toast.error(result.message ?? "처리 실패");
      }
    });
  }

  function saveTranslation() {
    if (!props.translation) return;
    const id = props.translation.id;
    startTransition(async () => {
      const r = await props.saveTranslation(id, translationDraft);
      if (r.ok) toast.success("번역 저장됨 (admin 버전으로 기록)");
      else toast.error(r.error ?? "저장 실패");
    });
  }

  function saveInterpretation() {
    if (!props.interpretation || !interpDraft) return;
    const id = props.interpretation.id;
    startTransition(async () => {
      const r = await props.saveInterpretation(id, {
        summary_ko: interpDraft.summary_ko,
        korea_applicability: interpDraft.korea_applicability,
        required_korea_data: interpDraft.required_korea_data,
        regulatory_impact: interpDraft.regulatory_impact,
        adoption_difficulty: interpDraft.adoption_difficulty,
        adoption_notes: interpDraft.adoption_notes,
      });
      if (r.ok) toast.success("해석 저장됨");
      else toast.error(r.error ?? "저장 실패");
    });
  }

  function triggerPublish() {
    if (!confirm("이 자료를 공개 사이트에 게시합니다. 계속할까요?")) return;
    startTransition(async () => {
      const r = await props.publish(props.documentId);
      if (r.ok) toast.success("게시됨. ISR revalidate 완료.");
      else toast.error(r.error ?? "게시 실패");
    });
  }

  function triggerArchive() {
    if (!confirm("아카이브 처리합니다. 공개 사이트에서 제외됩니다.")) return;
    startTransition(async () => {
      const r = await props.archive(props.documentId);
      if (r.ok) toast.success("archived로 전환됨");
      else toast.error(r.error ?? "실패");
    });
  }

  return (
    <div className="space-y-6">
      {/* Stage controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">깊이 단계 승격</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-[color:var(--color-muted-foreground)]">현재:</span>
            <DepthBadge stage={props.currentStage} showLabel />
            <span>→ 목표: {DEPTH_STAGE_LABELS[props.targetStage]}</span>
            <Badge variant="outline">{props.status}</Badge>
          </div>
          <div>
            <label className="text-xs font-semibold">
              원문 텍스트 직접 붙여넣기 (크롤링 실패 시 폴백 — 200자 이상이어야 인식)
            </label>
            <textarea
              value={sourcePaste}
              onChange={(e) => setSourcePaste(e.target.value)}
              rows={4}
              placeholder="(선택) 원문 본문 텍스트를 여기에 붙여넣으면 크롤링 대신 사용합니다."
              className="mt-1 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 font-mono text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {nextStages.length === 0 ? (
              <p className="text-sm text-[color:var(--color-muted-foreground)]">
                최종 단계입니다. 게시할 수 있습니다.
              </p>
            ) : (
              nextStages.map((s) => (
                <Button key={s} onClick={() => triggerPromote(s)} disabled={isPending}>
                  {isPending ? "처리 중…" : `${DEPTH_STAGE_LABELS[s]} 단계로 승격`}
                </Button>
              ))
            )}
            <Button
              variant="accent"
              onClick={triggerPublish}
              disabled={isPending || props.currentStage === "registered"}
            >
              게시 (published)
            </Button>
            <Button variant="outline" onClick={triggerArchive} disabled={isPending}>
              아카이브
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Translation editor */}
      {props.translation ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              번역 v{props.translation.version}
              {props.translation.glossary_match_rate != null ? (
                <span className="ml-2 text-xs text-[color:var(--color-muted-foreground)]">
                  용어 일치율 {Math.round(props.translation.glossary_match_rate * 100)}%
                </span>
              ) : null}
              {streaming ? (
                <span className="ml-2 animate-pulse text-xs text-[color:var(--color-accent)]">
                  ● 재생성 스트리밍 중
                </span>
              ) : null}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={regenerateSelection} disabled={isPending || streaming}>
                선택 부분 재생성 (R)
              </Button>
              <Button size="sm" onClick={saveTranslation} disabled={isPending || streaming}>
                저장
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-[color:var(--color-muted-foreground)]">
              단축키 — N: 다음 의심(◆) / A: 다음 단계 승격 / R: 선택 부분 재생성 / G: 용어 사전 새 탭
            </p>
            <textarea
              ref={translationRef}
              value={translationDraft}
              onChange={(e) => setTranslationDraft(e.target.value)}
              rows={24}
              className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 font-mono text-xs"
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Interpretation editor */}
      {interpDraft ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">한국형 해석</CardTitle>
            <Button size="sm" onClick={saveInterpretation} disabled={isPending}>
              저장
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="요약 (summary_ko)"
              value={interpDraft.summary_ko}
              onChange={(v) => setInterpDraft({ ...interpDraft, summary_ko: v })}
              rows={4}
            />
            <Field
              label="한국 적용 가능성"
              value={interpDraft.korea_applicability ?? ""}
              onChange={(v) => setInterpDraft({ ...interpDraft, korea_applicability: v })}
              rows={6}
            />
            <Field
              label="필요한 국내 데이터"
              value={interpDraft.required_korea_data ?? ""}
              onChange={(v) => setInterpDraft({ ...interpDraft, required_korea_data: v })}
              rows={3}
            />
            <Field
              label="규제 영향 (면책 문구 자동 부착됨)"
              value={interpDraft.regulatory_impact ?? ""}
              onChange={(v) => setInterpDraft({ ...interpDraft, regulatory_impact: v })}
              rows={5}
            />
            <Field
              label="도입 난이도"
              value={interpDraft.adoption_difficulty ?? ""}
              onChange={(v) => setInterpDraft({ ...interpDraft, adoption_difficulty: v })}
              rows={2}
            />
            <Field
              label="도입 노트 (선택)"
              value={interpDraft.adoption_notes ?? ""}
              onChange={(v) => setInterpDraft({ ...interpDraft, adoption_notes: v })}
              rows={4}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  rows,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly rows: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm"
      />
    </label>
  );
}
