import { notFound } from "next/navigation";
import { DocumentCard } from "@/components/library/DocumentCard";
import { Card, CardContent } from "@/components/ui/card";
import { listPublicDocuments } from "@/lib/supabase/queries/documents";
import {
  PRIMARY_TOPICS,
  PRIMARY_TOPIC_LABELS,
  type PrimaryTopic,
} from "@/types/domain";

export const revalidate = 60;

export async function generateStaticParams() {
  return PRIMARY_TOPICS.map((topic) => ({ topic }));
}

interface PageProps {
  readonly params: Promise<{ topic: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { topic } = await params;
  if (!(PRIMARY_TOPICS as readonly string[]).includes(topic)) return { title: "주제" };
  return { title: `${PRIMARY_TOPIC_LABELS[topic as PrimaryTopic]} — 주제별 보기` };
}

export default async function TopicPage({ params }: PageProps) {
  const { topic } = await params;
  if (!(PRIMARY_TOPICS as readonly string[]).includes(topic)) notFound();

  let result: Awaited<ReturnType<typeof listPublicDocuments>> = { rows: [], total: 0 };
  try {
    result = await listPublicDocuments({
      primaryTopic: topic as PrimaryTopic,
      limit: 48,
    });
  } catch {
    result = { rows: [], total: 0 };
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
          Topic
        </p>
        <h1 className="font-serif text-3xl">
          {PRIMARY_TOPIC_LABELS[topic as PrimaryTopic]}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
          총 {result.total}건
        </p>
      </header>

      {result.rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
            아직 이 주제의 공개 자료가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.rows.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
