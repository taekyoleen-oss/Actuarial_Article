import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  markFeedbackInReview,
  resolveFeedback,
  rejectFeedback,
} from "@/lib/actions/admin-feedback";
import { relativeTimeKR } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "피드백 — 관리자" };

interface FeedbackRow {
  id: string;
  document_id: string | null;
  member_id: string | null;
  category: "translation_error" | "interpretation_error" | "regulation_concern" | "other";
  body: string;
  status: "open" | "in_review" | "resolved" | "rejected";
  admin_note: string | null;
  created_at: string;
}

interface DocLite {
  id: string;
  slug: string;
  title: string;
  title_ko: string | null;
}

interface MemberLite {
  id: string;
  display_name: string;
  email: string;
}

const categoryLabel: Record<FeedbackRow["category"], string> = {
  translation_error: "번역 오류",
  interpretation_error: "해석 오류",
  regulation_concern: "규제 영향 우려",
  other: "기타",
};

export default async function AdminFeedbackPage() {
  let feedbacks: FeedbackRow[] = [];
  const docMap = new Map<string, DocLite>();
  const memberMap = new Map<string, MemberLite>();
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("aik_feedback")
      .select(
        "id, document_id, member_id, category, body, status, admin_note, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    feedbacks = (data ?? []) as unknown as FeedbackRow[];

    const docIds = Array.from(
      new Set(feedbacks.map((f) => f.document_id).filter((v): v is string => !!v)),
    );
    const memberIds = Array.from(
      new Set(feedbacks.map((f) => f.member_id).filter((v): v is string => !!v)),
    );
    if (docIds.length > 0) {
      const { data: docs } = await supabase
        .from("aik_documents")
        .select("id, slug, title, title_ko")
        .in("id", docIds);
      for (const d of (docs ?? []) as unknown as DocLite[]) docMap.set(d.id, d);
    }
    if (memberIds.length > 0) {
      const { data: members } = await supabase
        .from("aik_members")
        .select("id, display_name, email")
        .in("id", memberIds);
      for (const m of (members ?? []) as unknown as MemberLite[]) memberMap.set(m.id, m);
    }
  } catch {
    feedbacks = [];
  }

  const open = feedbacks.filter((f) => f.status === "open" || f.status === "in_review");
  const closed = feedbacks.filter((f) => f.status === "resolved" || f.status === "rejected");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl">피드백</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          회원이 제출한 자료별 오류·이의. open / in_review → 처리 → resolved / rejected.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">처리 대기 ({open.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {open.length === 0 ? (
            <p className="py-4 text-center text-sm text-[color:var(--color-muted-foreground)]">
              처리 대기 피드백이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {open.map((f) => (
                <FeedbackCard
                  key={f.id}
                  f={f}
                  doc={f.document_id ? docMap.get(f.document_id) : undefined}
                  member={f.member_id ? memberMap.get(f.member_id) : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {closed.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">완료 ({closed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {closed.slice(0, 20).map((f) => (
                <FeedbackCard
                  key={f.id}
                  f={f}
                  doc={f.document_id ? docMap.get(f.document_id) : undefined}
                  member={f.member_id ? memberMap.get(f.member_id) : undefined}
                  closed
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function FeedbackCard({
  f,
  doc,
  member,
  closed,
}: {
  readonly f: FeedbackRow;
  readonly doc?: DocLite;
  readonly member?: MemberLite;
  readonly closed?: boolean;
}) {
  return (
    <div className="rounded-md border border-[color:var(--color-border)] bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{categoryLabel[f.category]}</Badge>
        <Badge variant={f.status === "open" ? "accent" : "outline"}>{f.status}</Badge>
        <span className="text-xs text-[color:var(--color-muted-foreground)]">
          {relativeTimeKR(f.created_at)}
        </span>
        {member ? (
          <span className="text-xs text-[color:var(--color-muted-foreground)]">
            · {member.display_name} ({member.email})
          </span>
        ) : null}
      </div>

      {doc ? (
        <Link
          href={`/admin/documents/${doc.id}/review`}
          className="mt-2 block truncate text-xs text-[color:var(--color-primary)] hover:underline"
        >
          {doc.title_ko || doc.title} →
        </Link>
      ) : (
        <p className="mt-2 text-xs text-[color:var(--color-muted-foreground)]">
          자료가 archived이거나 삭제됨
        </p>
      )}

      <p className="mt-2 whitespace-pre-wrap text-sm">{f.body}</p>

      {f.admin_note ? (
        <p className="mt-2 rounded-sm bg-[color:var(--color-muted)]/40 px-2 py-1 text-xs">
          관리자 노트: {f.admin_note}
        </p>
      ) : null}

      {!closed ? (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[color:var(--color-border)] pt-3">
          {f.status === "open" ? (
            <form action={markFeedbackInReview}>
              <input type="hidden" name="feedback_id" value={f.id} />
              <Button type="submit" size="sm" variant="outline">
                in_review로 표시
              </Button>
            </form>
          ) : null}
          <form action={resolveFeedback} className="flex flex-1 items-end gap-2">
            <input type="hidden" name="feedback_id" value={f.id} />
            <label className="flex-1 text-xs">
              <span className="mb-1 block text-[10px] font-semibold uppercase">관리자 노트</span>
              <input
                name="admin_note"
                placeholder="해결 내용 간단히…"
                className="w-full rounded-md border border-[color:var(--color-border)] bg-white px-2 py-1 text-xs"
              />
            </label>
            <Button type="submit" size="sm">
              해결
            </Button>
          </form>
          <form action={rejectFeedback}>
            <input type="hidden" name="feedback_id" value={f.id} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="text-[color:var(--color-destructive)]"
            >
              거절
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
