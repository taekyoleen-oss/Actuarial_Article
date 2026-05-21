import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 3600;

export const metadata = {
  title: "국내 데이터 카탈로그",
  description:
    "KOSIS · 통계청 생명표 · 보험연구원 등 한국 보험 실무에 자주 참조되는 통계 자원 링크 카탈로그",
};

interface CatalogEntry {
  readonly name: string;
  readonly org: string;
  readonly url: string;
  readonly description: string;
  readonly dataType: string;
}

// MVP는 정적 시드. M2~에서 aik_korea_data_sources 동적 로딩으로 교체.
const seed: ReadonlyArray<CatalogEntry> = [
  {
    name: "국가통계포털 KOSIS",
    org: "통계청",
    url: "https://kosis.kr",
    description: "인구·건강·복지·노동 등 광범위한 공공 데이터 포털.",
    dataType: "통계",
  },
  {
    name: "생명표",
    org: "통계청",
    url: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1B41",
    description: "연령별 사망확률·기대여명. 위험률 개발 기준 데이터.",
    dataType: "생명표",
  },
  {
    name: "보험연구원 KIRI",
    org: "보험연구원",
    url: "https://www.kiri.or.kr",
    description: "한국 보험시장 구조·제도 해설·연구 리포트.",
    dataType: "리서치",
  },
  {
    name: "금융감독원 공시",
    org: "금융감독원",
    url: "https://www.fss.or.kr",
    description: "보험·금융 감독 공시·통계·정책 자료.",
    dataType: "감독·공시",
  },
];

export default function DataCatalogPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl">국내 데이터 카탈로그</h1>
        <p className="mt-1 max-w-prose text-sm text-[color:var(--color-muted-foreground)]">
          한국 보험 실무에서 가장 자주 참조되는 통계·데이터 자원 링크. 한국 논문·리서치 자료는
          라이브러리 본체(<code className="text-xs">region: 국내</code>)에서 별도 큐레이션합니다.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {seed.map((entry) => (
          <Card key={entry.url}>
            <CardHeader>
              <CardTitle className="text-lg">{entry.name}</CardTitle>
              <p className="text-xs text-[color:var(--color-muted-foreground)]">
                {entry.org} · {entry.dataType}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-[color:var(--color-muted-foreground)]">{entry.description}</p>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--color-primary)] hover:underline"
              >
                {entry.url} ↗
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
