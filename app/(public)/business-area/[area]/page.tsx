import { notFound } from "next/navigation";
import { DocumentCard } from "@/components/library/DocumentCard";
import { Card, CardContent } from "@/components/ui/card";
import { listPublicDocuments } from "@/lib/supabase/queries/documents";
import {
  BUSINESS_AREAS,
  BUSINESS_AREA_LABELS,
  type BusinessArea,
} from "@/types/domain";

export const revalidate = 60;

export async function generateStaticParams() {
  return BUSINESS_AREAS.map((area) => ({ area }));
}

interface PageProps {
  readonly params: Promise<{ area: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { area } = await params;
  if (!(BUSINESS_AREAS as readonly string[]).includes(area)) return { title: "업무영역" };
  return {
    title: `${BUSINESS_AREA_LABELS[area as BusinessArea]} — 업무영역 보드`,
  };
}

export default async function BusinessAreaPage({ params }: PageProps) {
  const { area } = await params;
  if (!(BUSINESS_AREAS as readonly string[]).includes(area)) notFound();

  let result: Awaited<ReturnType<typeof listPublicDocuments>> = { rows: [], total: 0 };
  try {
    result = await listPublicDocuments({
      businessArea: area as BusinessArea,
      limit: 48,
    });
  } catch {
    result = { rows: [], total: 0 };
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
          Business Area
        </p>
        <h1 className="font-serif text-3xl">
          {BUSINESS_AREA_LABELS[area as BusinessArea]}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
          총 {result.total}건
        </p>
      </header>

      {result.rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
            이 업무영역에 큐레이션된 자료가 아직 없습니다.
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
