import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireActiveMember } from "@/lib/supabase/member-guard";
import { removeBookmark } from "@/lib/actions/member";
import { DepthBadge } from "@/components/shared/DepthBadge";
import { RegionPill } from "@/components/shared/RegionPill";
import { relativeTimeKR } from "@/lib/utils";
import type { DepthStage, Region } from "@/types/domain";

export const dynamic = "force-dynamic";
export const metadata = { title: "내 책갈피" };

interface BookmarkRow {
  id: string;
  note: string | null;
  created_at: string;
  document_id: string;
  document: {
    slug: string;
    title: string;
    title_ko: string | null;
    depth_stage: DepthStage;
    region: Region;
    source_organization: string | null;
  };
}

export default async function BookmarksPage() {
  const ctx = await requireActiveMember();

  // Join via two-step query because aik_public_documents is a view (no FK)
  const { data: bookmarksRaw } = await ctx.supabase
    .from("aik_bookmarks")
    .select("id, note, created_at, document_id")
    .eq("member_id", ctx.member.id)
    .order("created_at", { ascending: false });

  const list = (bookmarksRaw ?? []) as ReadonlyArray<{
    id: string;
    note: string | null;
    created_at: string;
    document_id: string;
  }>;

  const docIds = list.map((b) => b.document_id);
  const docMap = new Map<string, BookmarkRow["document"]>();
  if (docIds.length > 0) {
    const { data: docs } = await ctx.supabase
      .from("aik_public_documents")
      .select("id, slug, title, title_ko, depth_stage, region, source_organization")
      .in("id", docIds);
    for (const d of (docs ?? []) as ReadonlyArray<BookmarkRow["document"] & { id: string }>) {
      docMap.set(d.id, d);
    }
  }

  const rows: BookmarkRow[] = list.map((b) => ({
    ...b,
    document:
      docMap.get(b.document_id) ?? {
        slug: "",
        title: "(자료가 비공개되거나 삭제됨)",
        title_ko: null,
        depth_stage: "registered",
        region: "overseas",
        source_organization: null,
      },
  }));

  return (
    <div>
      <p className="mb-4 text-sm text-[color:var(--color-muted-foreground)]">
        총 {rows.length}건의 책갈피
      </p>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
            아직 책갈피한 자료가 없습니다. <br />
            <Link href="/library" className="mt-2 inline-block text-[color:var(--color-primary)] hover:underline">
              라이브러리에서 추가 →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((b) => (
            <li key={b.id} className="rounded-md border border-[color:var(--color-border)] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={b.document.slug ? `/library/${b.document.slug}` : "/library"}
                    className="font-medium hover:text-[color:var(--color-primary)]"
                  >
                    {b.document.title_ko || b.document.title}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[color:var(--color-muted-foreground)]">
                    <RegionPill region={b.document.region} />
                    <DepthBadge stage={b.document.depth_stage} />
                    <span>{b.document.source_organization ?? "—"}</span>
                    <span>·</span>
                    <span>{relativeTimeKR(b.created_at)} 책갈피</span>
                  </p>
                  {b.note ? (
                    <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                      메모: {b.note}
                    </p>
                  ) : null}
                </div>
                <form action={removeBookmark}>
                  <input type="hidden" name="bookmark_id" value={b.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="text-[color:var(--color-destructive)]"
                  >
                    제거
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
