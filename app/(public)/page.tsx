import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/library/DocumentCard";
import { listLatestForLanding } from "@/lib/supabase/queries/documents";
import {
  BUSINESS_AREA_LABELS,
  BUSINESS_AREAS,
  PRIMARY_TOPIC_LABELS,
  PRIMARY_TOPICS,
} from "@/types/domain";

export const revalidate = 60; // ISR 60s (per §렌더링 전략)

const HERO_TOPICS = ["mortality", "longevity", "ifrs17", "k_ics", "underwriting"] as const;

export default async function LandingPage() {
  let latest: Awaited<ReturnType<typeof listLatestForLanding>> = [];
  try {
    latest = await listLatestForLanding(6);
  } catch {
    // Pre-DB state: show empty hero gracefully.
    latest = [];
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="grid items-end gap-8 pt-4 md:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Actuarial Intel Korea · v0.1
          </p>
          <h1 className="font-serif text-4xl leading-tight md:text-5xl">
            해외·국내 보험 자료를
            <br />
            <span className="text-[color:var(--color-primary)]">한국 실무 도입 관점</span>으로
            정제합니다.
          </h1>
          <p className="mt-5 max-w-prose text-base text-[color:var(--color-muted-foreground)]">
            SOA·재보험사·감독당국·학회의 무료 공개 자료, 그리고 보험연구원·금감원 등 국내 주요 자료를
            번역하고, 한국 시장·규제·데이터 환경과 비교한 도입방안을 단계적으로 제공합니다.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/library">라이브러리 둘러보기</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">플랫폼 소개·정책</Link>
            </Button>
          </div>
        </div>

        <Card className="bg-[color:var(--color-muted)]/40">
          <CardHeader>
            <CardTitle className="text-base">4단계 처리 깊이</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">메타 → 요약 → 본문 번역 → 해석·도입방안</span>
            </p>
            <p className="text-[color:var(--color-muted-foreground)]">
              모든 자료가 같은 깊이로 처리되지는 않습니다. 한국 보험 실무에 즉시 가치 있는 자료는
              4단계 전체를, 참조 가치만 있는 자료는 메타·요약 수준에서 큐레이션합니다.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Latest */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">최근 큐레이션</h2>
          <Link
            href="/library"
            className="text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
          >
            전체 보기 →
          </Link>
        </div>
        {latest.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
              아직 등록된 공개 자료가 없습니다. 시드 자료 게시 후 표시됩니다.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </section>

      {/* Topic entries */}
      <section>
        <h2 className="mb-5 font-serif text-2xl">주제별 진입</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {HERO_TOPICS.map((topic) => (
            <Link
              key={topic}
              href={`/topics/${topic}`}
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-5 text-center transition-colors hover:border-[color:var(--color-primary)]"
            >
              <p className="font-serif text-base">{PRIMARY_TOPIC_LABELS[topic]}</p>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-[color:var(--color-muted-foreground)]">
          전체 주제 {PRIMARY_TOPICS.length}개 ·{" "}
          <Link href="/library" className="underline">
            라이브러리에서 필터로 보기
          </Link>
        </p>
      </section>

      {/* Business areas */}
      <section>
        <h2 className="mb-5 font-serif text-2xl">업무영역별 보드</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {BUSINESS_AREAS.map((area) => (
            <Link
              key={area}
              href={`/business-area/${area}`}
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-5 transition-colors hover:border-[color:var(--color-primary)]"
            >
              <p className="font-serif text-base">{BUSINESS_AREA_LABELS[area]}</p>
              <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                관련 큐레이션 보기 →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
