import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 3600;

export const metadata = {
  title: "소개",
};

export default function AboutPage() {
  const submitEmail = process.env.SUBMISSION_CONTACT_EMAIL ?? "submit@actuarial-intel.kr";
  const submitForm = process.env.SUBMISSION_FORM_URL ?? "https://forms.gle/your-form-id";

  return (
    <div className="prose-actuarial mx-auto">
      <h1 className="font-serif text-3xl">Actuarial Intel Korea 소개</h1>
      <p>
        해외·국내 보험·계리 자료를 한국 보험 실무 도입 관점에서 큐레이션하는 플랫폼입니다.
        주된 목적은 <strong>실무 도입 기여</strong>이며, 단순 번역 저장소가 아닌
        <em> 도입방안·규제 영향·필요 데이터까지 제시하는 판단 도구</em>를 지향합니다.
      </p>

      <h2>플랫폼 철학</h2>
      <ul>
        <li>모든 자료가 동일 깊이로 처리되지 않습니다 — 4단계 처리 깊이로 차등 운영</li>
        <li>한국 시장·규제(K-ICS·IFRS 17) 관점의 재해석을 핵심 가치로 제공</li>
        <li>저작권을 존중하여 원문은 외부 링크로 안내, 메타·요약·한국형 해석만 게재</li>
        <li>회원이 되면 번역 본문 전문, 책갈피, 필터 저장, 피드백 제출이 가능합니다</li>
      </ul>

      <h2>자료 제안</h2>
      <p>
        외부 자료(논문·기관 보고서)를 제안하고 싶으시면 다음 두 채널 중 하나를 이용해 주세요.
        관리자가 검토 후 큐레이션 대상으로 등록 여부를 판단합니다.
      </p>
      <ul>
        <li>
          이메일:{" "}
          <a href={`mailto:${submitEmail}`} className="text-[color:var(--color-primary)]">
            {submitEmail}
          </a>
        </li>
        <li>
          외부 양식:{" "}
          <a
            href={submitForm}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--color-primary)]"
          >
            제안 양식 열기 ↗
          </a>
        </li>
      </ul>
      <p className="text-sm text-[color:var(--color-muted-foreground)]">
        ※ 본 사이트 내에는 별도 자료 제안 UI를 두지 않습니다. 스팸·품질 관리를 위해 외부 채널로
        수의 접수하며, 등록 시 발신자·날짜를 자료 메모로 보존합니다.
      </p>

      <h2>콘텐츠 수집 정책</h2>
      <Card className="not-prose my-6">
        <CardHeader>
          <CardTitle className="text-base">게재 가능 자료</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>발행기관 사이트에서 비회원·비결제 상태로 즉시 다운로드 가능한 자료만 수집·게재합니다.</p>
          <p className="text-[color:var(--color-muted-foreground)]">
            SOA Members-only 페이지·CCC 결제형 라이센스·학회 페이월 자료는 게재 대상이 아닙니다.
          </p>
        </CardContent>
      </Card>

      <h2>면책 고지</h2>
      <p className="text-sm text-[color:var(--color-muted-foreground)]">
        본 플랫폼이 제공하는 한국형 해석·규제 영향·도입방안은 참고용입니다. 실제 적용·해석은
        소속 회사·감독원의 공식 해석을 따르시기 바랍니다.
      </p>

      <h2>운영자</h2>
      <Card className="not-prose my-6">
        <CardContent className="flex items-center gap-4 py-6">
          <Image
            src="/brand/svg/01-primary-transparent.svg"
            alt="tkLeen mark"
            width={56}
            height={56}
            className="shrink-0"
          />
          <div className="text-sm">
            <p className="font-serif text-base font-semibold">tkLeen</p>
            <p className="text-[color:var(--color-muted-foreground)]">
              보험·금융 실무를 위한 AI 워크플로우. Actuarial Intel Korea는 tkLeen이 1인 운영하는
              큐레이션 프로젝트입니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-12 text-sm">
        <Link href="/library" className="text-[color:var(--color-primary)] hover:underline">
          ← 라이브러리로 돌아가기
        </Link>
      </p>
    </div>
  );
}
