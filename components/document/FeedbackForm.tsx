"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitFeedback } from "@/lib/actions/member";

interface FeedbackFormProps {
  readonly documentId: string;
}

const categories = [
  { value: "translation_error", label: "번역 오류" },
  { value: "interpretation_error", label: "해석 오류" },
  { value: "regulation_concern", label: "규제 영향 우려" },
  { value: "other", label: "기타" },
] as const;

export function FeedbackForm({ documentId }: FeedbackFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]["value"]>("translation_error");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (body.trim().length < 10) {
      toast.error("내용은 10자 이상 입력해 주세요.");
      return;
    }
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("document_id", documentId);
        fd.set("category", category);
        fd.set("body", body.trim());
        await submitFeedback(fd);
        toast.success("피드백이 접수되었습니다. 영업일 3일 이내 1차 응답을 받게 됩니다.");
        setBody("");
        setOpen(false);
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  if (!open) {
    return (
      <Card className="bg-[color:var(--color-muted)]/30">
        <CardContent className="flex items-center justify-between py-4 text-sm">
          <span className="text-[color:var(--color-muted-foreground)]">
            이 자료의 번역·해석에 오류나 의견이 있으신가요?
          </span>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            피드백 작성
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">피드백 제출</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold">분류</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold">내용 (10자 이상)</span>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              placeholder="예: 3번째 단락 'mortality improvement'를 '사망률 감소'로 번역했는데 표준 용어는 '사망률 개선'입니다."
              className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-right text-xs text-[color:var(--color-muted-foreground)]">
              {body.length} / 2000
            </span>
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "제출 중…" : "제출"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
