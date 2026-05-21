import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdoptionBadge } from "@/components/shared/AdoptionBadge";
import { DepthBadge } from "@/components/shared/DepthBadge";
import { RegionPill } from "@/components/shared/RegionPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/document/BookmarkButton";
import { FeedbackForm } from "@/components/document/FeedbackForm";
import { getPublicDocumentBySlug } from "@/lib/supabase/queries/documents";
import { getActiveMember } from "@/lib/supabase/member-guard";
import {
  BUSINESS_AREA_LABELS,
  DEPTH_STAGE_LABELS,
  DEPTH_STAGE_ORDINAL,
  PRIMARY_TOPIC_LABELS,
} from "@/types/domain";
import { formatDateKR } from "@/lib/utils";

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

export const revalidate = false; // SSG with on-demand revalidate

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const result = await getPublicDocumentBySlug(slug);
    if (!result) return { title: "자료를 찾을 수 없습니다" };
    const { document } = result;
    return {
      title: document.title_ko || document.title,
      description: document.title,
      openGraph: {
        title: document.title_ko || document.title,
        description: `${document.source_organization} · ${formatDateKR(document.published_at)}`,
      },
    };
  } catch {
    return { title: "Actuarial Intel Korea" };
  }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let data: Awaited<ReturnType<typeof getPublicDocumentBySlug>> = null;
  try {
    data = await getPublicDocumentBySlug(slug);
  } catch {
    data = null;
  }
  if (!data) notFound();

  const { document, interpretation } = data;
  const reachedInterpreted = DEPTH_STAGE_ORDINAL[document.depth_stage] >= 4;
  const reachedTranslated = DEPTH_STAGE_ORDINAL[document.depth_stage] >= 3;

  // M3 member context — translation body + bookmark + feedback
  const member = await getActiveMember();
  let translationBody: string | null = null;
  let initialBookmarked = false;
  if (member && reachedTranslated) {
    const { data: latestTrans } = await member.supabase
      .from("aik_translations")
      .select("content_md")
      .eq("document_id", document.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    translationBody = (latestTrans as { content_md: string } | null)?.content_md ?? null;

    const { data: bookmark } = await member.supabase
      .from("aik_bookmarks")
      .select("id")
      .eq("member_id", member.member.id)
      .eq("document_id", document.id)
      .maybeSingle();
    initialBookmarked = !!bookmark;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://actuarial-intel.kr";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: document.title_ko || document.title,
    alternativeHeadline: document.title_ko ? document.title : undefined,
    inLanguage: "ko-KR",
    isAccessibleForFree: true,
    datePublished: document.published_at ?? undefined,
    publisher: {
      "@type": "Organization",
      name: "Actuarial Intel Korea",
      url: siteUrl,
    },
    sourceOrganization: {
      "@type": "Organization",
      name: document.source_organization,
    },
    url: `${siteUrl}/library/${document.slug}`,
    image: `${siteUrl}/api/og/${document.slug}`,
    description: interpretation?.summary_ko ?? document.title,
    keywords: [
      document.primary_topic,
      ...document.business_areas,
      document.region,
    ].join(", "),
  };

  return (
    <article className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="space-y-8">
        {/* Title block */}
        <header className="space-y-3 border-b border-[color:var(--color-border)] pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <RegionPill region={document.region} />
            <DepthBadge stage={document.depth_stage} showLabel />
            {document.adoption_grade ? (
              <AdoptionBadge grade={document.adoption_grade} />
            ) : null}
            <Badge variant="outline">{PRIMARY_TOPIC_LABELS[document.primary_topic]}</Badge>
          </div>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">
            {document.title_ko || document.title}
          </h1>
          {document.title_ko ? (
            <p className="text-base text-[color:var(--color-muted-foreground)]">
              {document.title}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              {document.source_organization} · {document.source_name} · 발행일{" "}
              {formatDateKR(document.published_at)}
            </p>
            {member ? (
              <BookmarkButton
                documentId={document.id}
                initialBookmarked={initialBookmarked}
              />
            ) : null}
          </div>
        </header>

        {/* 한국형 해석 (상단 고정, depth_stage='interpreted'일 때만) */}
        {reachedInterpreted && interpretation ? (
          <section
            id="korea-interpretation"
            className="rounded-md border-2 border-[color:var(--color-primary)]/30 bg-[color:var(--color-muted)]/30 p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 font-serif text-xl">
              🇰🇷 한국형 해석
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
                  요약
                </p>
                <p>{interpretation.summary_ko}</p>
              </div>
              {interpretation.korea_applicability ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
                    한국 적용 가능성
                  </p>
                  <p>{interpretation.korea_applicability}</p>
                </div>
              ) : null}
              {interpretation.target_departments.length > 0 ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
                    적용 업무영역
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {interpretation.target_departments.map((area) => (
                      <Badge key={area} variant="outline">
                        {BUSINESS_AREA_LABELS[area]}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {interpretation.adoption_difficulty || interpretation.adoption_notes ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
                    도입 난이도·노트
                  </p>
                  {interpretation.adoption_difficulty ? (
                    <p>{interpretation.adoption_difficulty}</p>
                  ) : null}
                  {interpretation.adoption_notes ? (
                    <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
                      {interpretation.adoption_notes}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <p className="text-xs text-[color:var(--color-muted-foreground)]">
                ※ 참고용이며 실제 적용은 소속 회사·감독원 해석을 따릅니다.
              </p>
            </div>
          </section>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-[color:var(--color-muted-foreground)]">
              이 자료는 현재 <strong>{DEPTH_STAGE_LABELS[document.depth_stage]}</strong> 단계입니다.
              한국형 해석·도입방안은 <em>interpreted</em> 단계로 승격되면 표시됩니다.
            </CardContent>
          </Card>
        )}

        {/* 번역 본문 영역 (회원 전용) */}
        <section>
          <h2 className="mb-3 font-serif text-xl">번역 본문</h2>
          {!reachedTranslated ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-[color:var(--color-muted-foreground)]">
                번역이 아직 완료되지 않은 자료입니다.
              </CardContent>
            </Card>
          ) : member && translationBody ? (
            <Card>
              <CardContent className="prose-actuarial max-w-none py-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {translationBody}
                </ReactMarkdown>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-[color:var(--color-muted-foreground)]">
                  번역 본문 전문은 로그인 회원에게 노출됩니다.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Button asChild>
                    <Link href={`/auth/login?next=/library/${document.slug}`}>로그인</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/auth/signup">회원 가입</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* 피드백 (회원 전용) */}
        {member ? <FeedbackForm documentId={document.id} /> : null}

        {/* 원문 안내 */}
        <section>
          <h2 className="mb-3 font-serif text-xl">원문</h2>
          <Card>
            <CardContent className="flex items-center justify-between py-5">
              <div>
                <p className="text-sm">
                  {document.source_organization}의 원본 페이지에서 자료를 확인할 수 있습니다.
                </p>
                <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                  본 플랫폼은 자료 사본을 호스팅하지 않습니다.
                </p>
              </div>
              <Button asChild>
                <a
                  href={`#external-link-${document.id}`}
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                >
                  Read at {document.source_organization} →
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* 우측 TOC / 메타 */}
      <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">자료 메타</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-[color:var(--color-muted-foreground)]">발행기관</p>
              <p>{document.source_organization}</p>
            </div>
            <div>
              <p className="text-[color:var(--color-muted-foreground)]">발행일</p>
              <p>{formatDateKR(document.published_at)}</p>
            </div>
            <div>
              <p className="text-[color:var(--color-muted-foreground)]">처리 깊이</p>
              <DepthBadge stage={document.depth_stage} showLabel />
            </div>
            <div>
              <p className="text-[color:var(--color-muted-foreground)]">인용 정책</p>
              <p className="text-xs">{document.quotation_policy}</p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </article>
  );
}
