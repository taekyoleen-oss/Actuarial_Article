import Link from "next/link";
import { DocumentCard } from "@/components/library/DocumentCard";
import { Card, CardContent } from "@/components/ui/card";
import { listPublicDocuments } from "@/lib/supabase/queries/documents";
import {
  ADOPTION_GRADES,
  ADOPTION_GRADE_LABELS,
  BUSINESS_AREAS,
  BUSINESS_AREA_LABELS,
  DEPTH_STAGES,
  DEPTH_STAGE_LABELS,
  PRIMARY_TOPICS,
  PRIMARY_TOPIC_LABELS,
  REGIONS,
  REGION_LABELS,
} from "@/types/domain";
import type {
  AdoptionGrade,
  BusinessArea,
  DepthStage,
  PrimaryTopic,
  Region,
} from "@/types/domain";

export const revalidate = 60;

interface LibrarySearchParams {
  readonly region?: Region;
  readonly depth?: DepthStage;
  readonly topic?: PrimaryTopic;
  readonly area?: BusinessArea;
  readonly grade?: AdoptionGrade;
  readonly q?: string;
}

function FilterGroup<T extends string>({
  label,
  param,
  current,
  options,
  labels,
  searchParams,
}: {
  readonly label: string;
  readonly param: keyof LibrarySearchParams;
  readonly current: T | undefined;
  readonly options: readonly T[];
  readonly labels: Record<T, string>;
  readonly searchParams: LibrarySearchParams;
}) {
  const buildHref = (value: T | undefined) => {
    const next = { ...searchParams } as Record<string, string | undefined>;
    if (value === undefined || value === current) {
      next[param as string] = undefined;
    } else {
      next[param as string] = value;
    }
    const qs = Object.entries(next)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join("&");
    return qs ? `/library?${qs}` : "/library";
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
        {label}
      </p>
      <ul className="space-y-1 text-sm">
        {options.map((opt) => {
          const active = current === opt;
          return (
            <li key={opt}>
              <Link
                href={buildHref(opt)}
                className={`block rounded-sm px-2 py-1 transition-colors ${
                  active
                    ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)]"
                    : "hover:bg-[color:var(--color-muted)]"
                }`}
              >
                {labels[opt]}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function LibraryPage({
  searchParams,
}: {
  readonly searchParams: Promise<LibrarySearchParams>;
}) {
  const params = await searchParams;

  let result: Awaited<ReturnType<typeof listPublicDocuments>> = { rows: [], total: 0 };
  try {
    result = await listPublicDocuments({
      region: params.region,
      depth: params.depth,
      primaryTopic: params.topic,
      businessArea: params.area,
      adoptionGrade: params.grade,
      q: params.q,
      limit: 24,
    });
  } catch {
    result = { rows: [], total: 0 };
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl">라이브러리</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
            총 {result.total}건
          </p>
        </div>

        <FilterGroup
          label="Region"
          param="region"
          current={params.region}
          options={REGIONS}
          labels={REGION_LABELS}
          searchParams={params}
        />
        <FilterGroup
          label="처리 깊이"
          param="depth"
          current={params.depth}
          options={DEPTH_STAGES}
          labels={DEPTH_STAGE_LABELS}
          searchParams={params}
        />
        <FilterGroup
          label="주제"
          param="topic"
          current={params.topic}
          options={PRIMARY_TOPICS}
          labels={PRIMARY_TOPIC_LABELS}
          searchParams={params}
        />
        <FilterGroup
          label="업무영역"
          param="area"
          current={params.area}
          options={BUSINESS_AREAS}
          labels={BUSINESS_AREA_LABELS}
          searchParams={params}
        />
        <FilterGroup
          label="도입 등급"
          param="grade"
          current={params.grade}
          options={ADOPTION_GRADES}
          labels={ADOPTION_GRADE_LABELS}
          searchParams={params}
        />
      </aside>

      <div>
        {result.rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-[color:var(--color-muted-foreground)]">
              조건에 맞는 자료가 아직 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {result.rows.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
