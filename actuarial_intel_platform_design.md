# 해외 계리자료 번역·한국형 해석 플랫폼 (Actuarial Intel Korea) 웹 개발 설계서

**문서 버전**: v1.2
**작성일**: 2026-05-21 (v1.0: 2026-05-20, v1.1: 2026-05-21)
**기술 스택**: Next.js 15 (App Router) · TweakCN (shadcn/ui) · Supabase · Anthropic Claude Sonnet
**구현 도구**: Claude Code

**v1.2 변경 요약** (콘텐츠 소스 다변화·처리 깊이 단계 도입):
- 콘텐츠 범위 확대: SOA 외 보험·계리 관련 논문, 저명 기관(재보험사·감독당국·학회) 자료, **국내 주요 자료** 포함
- 자료 처리 4단계 깊이 도입: `registered`(메타) → `summarized`(요약) → `translated`(본문 번역) → `interpreted`(해석+도입방안)
- 콘텐츠 소싱 3트랙 분리: ① 저명 기관 자동 정기 수집(M2 도입, 주 1회), ② 관리자 큐레이션(이메일·외부 양식 수의), ③ 국내 자료 별도 수집
- 라이브러리에 `region`(overseas/domestic)·`depth_stage`·`track` 필터 추가, 데이터 카탈로그는 통계 전용으로 유지
- 자료 제안은 별도 시스템 UI 신설 없이 이메일·외부 양식 수의 채널만 (about 페이지 안내)
- 부록 E(자료 트랙·깊이 매트릭스) 신설

**v1.1 변경 요약** (인터뷰 결과 반영):
- 회원 등급(이메일 도메인 화이트리스트 + 관리자 승인) 추가 → anon / member / admin 3-tier 권한 모델
- 콘텐츠 수집 정책 신설: SOA Members-only 자료 제외, 무료 공개 자료만 수집 (부록 C)
- PDF 보존 정책: 자체 저장 X, 원본 URL 보존 + 회원에게 외부 링크 제공
- 파이프라인 인프라: Vercel Cron + Supabase Edge Function(백그라운드) + Realtime 상태
- 알림 채널: 인앱 알림만, Resend 제거 (트랜잭셔널 메일은 Supabase Auth 기본만)
- 디자인 토큰 확정: Noto Serif KR + Pretendard + JetBrains Mono / 다크 모드는 공개 페이지만
- 마일스톤 M1/M2/M3, 백업 정책, 운영 캐던스(주당 10시간) 명시

---

## 1. 프로젝트 컨텍스트

### 1.1 배경
SOA(Society of Actuaries)를 비롯한 해외 계리·보험 자료는 mortality, longevity, mortality improvement, predictive analytics, accelerated underwriting 등 한국 보험시장에서도 활용 가치가 높은 연구를 지속적으로 산출하고 있다. 더 넓게 보면 **재보험사 리서치(Munich Re·Swiss Re Sigma 등), 감독당국·국제기구 가이드(EIOPA·IAIS), 학회·학술 논문, 한국 내 보험연구원·금융감독원·통계청·학회 등의 주요 자료** 또한 실무 의사결정에 직결되는 자원이다.

그러나 국내 실무에서는 (1) 이런 자료가 기관·언어·접근 경로별로 분산되어 있고, (2) 영문 원문 해석에 시간이 들며, (3) 한국 시장·규제(K-ICS, IFRS 17) 관점에서의 재해석이 누락된 채 소비되는 비효율이 반복된다.

본 플랫폼은 **선별된 해외·국내 자료의 수집 → 한국어 번역 → 한국 실정 비교 → 도입방안 제시**를 단계적으로 처리해, 단순 번역 저장소가 아닌 **보험 실무 도입 판단 도구**로 기능한다. 모든 자료가 끝까지 전부 번역·해석되지는 않으며, 자료별로 메타·요약·번역·해석의 4단계 처리 깊이를 차등 적용한다 (부록 E 매트릭스 참조).

### 1.2 목적
- **주된 목적 (실무 도입 기여)**: 해외·국내 자료 중 한국 보험 실무에 유의미한 자료를 선별해 한국어로 번역하고, 한국 시장·규제·데이터 환경과 비교한 **도입방안**을 제시한다 — 상품개발·위험률·언더라이팅·IFRS 17·K-ICS·재보험·경영기획 실무에 즉시 활용 가능한 형태
- **부차 목적 (정보 제공)**: 선진 보험·계리 정보를 메타·요약 단위로 폭넓게 큐레이션해, 도입 단계까지 가지 않은 자료도 발견·탐색·참조할 수 있도록 한다

세부 운영 목표:
- 저명 기관 자료(SOA 등)는 정기 자동 수집으로 신규 발행을 놓치지 않는다 (M2 도입)
- 학술 논문·외부 추천 자료는 관리자가 이메일·외부 양식으로 수의 접수해 큐레이션한다
- 국내 자료(논문·보험연구원·감독원·학회)는 별도 수집 트랙을 운영해 라이브러리에 통합한다
- 모든 자료는 검수 게이트를 거치며, 일관된 용어 사전·면책 문구·인용 정책 하에 게시된다

### 1.3 대상 사용자
| 구분 | 인증 | 권한 |
|------|------|------|
| **일반 방문자** (계리사, 상품개발 실무자, 리스크관리자, 연구원) | 익명 (로그인 불필요) | 메타데이터·한국형 해석·요약·태그·용어사전·데이터 카탈로그 열람 |
| **회원** (실명·소속·이메일 도메인 화이트리스트 통과자) | Supabase Auth (이메일+비밀번호) | 일반 방문자 권한 + 번역 본문 전문 열람 + 책갈피 + 도입등급 필터 저장 + 원본 URL 링크 안내 + 피드백 제출 |
| **관리자** (운영자, tkleen) | Supabase Auth (이메일) + `aik_admin_users` | 자료 등록, 검수, 용어사전 관리, 게시 승인, 회원 승인, 피드백 처리 |

회원 가입은 (1) 자유 신청 → (2) 이메일 도메인 화이트리스트 자동 1차 분류 → (3) 관리자 수동 승인의 3단계. 도메인 화이트리스트는 `MEMBER_DOMAIN_WHITELIST` 환경변수에서 관리(예: 국내 보험사·재보험사·감독원·계리법인·학교 도메인). 화이트리스트 외 도메인도 신청 가능하나 관리자 수동 검토 비중이 커진다.

### 1.4 핵심 기능 요약
1. **3트랙 콘텐츠 소싱**:
   - **자동 정기 수집** (M2~): Vercel Cron 주 1회로 사전 등록된 저명 기관(SOA·재보험사·감독당국 등)의 목록·피드 페이지에서 신규 URL 탐지 → 관리자 승인 큐
   - **관리자 큐레이션**: 학술 논문·기관 보고서를 관리자가 직접 URL 등록 (현 설계 유지). **외부 사용자 제안은 별도 시스템 UI 없이 이메일·외부 양식(Google Form 등) 수의 채널**로 접수 → 관리자가 평가 후 직접 등록
   - **국내 자료 큐레이션**: 한국 논문·보험연구원·감독원·학회 자료 별도 수집 트랙, `region=domestic`으로 분류해 라이브러리에 통합
2. **자료 처리 4단계 깊이** (`depth_stage`): `registered`(메타만) → `summarized`(요약 번역) → `translated`(본문 번역) → `interpreted`(한국형 해석+도입방안). 자료별 처리 깊이는 관리자가 선택. 라이브러리에서 깊이로 필터 가능
3. 계리 용어 사전 기반 LLM 번역 (Anthropic Sonnet 4.6) + 문장 레벨 캐시로 일관성 확보. **무료 공개 자료만 수집** — SOA Members-only 자료는 게재 X
4. 한국형 해석 자동 생성 — `interpreted` 단계 자료에 한정 (요약·적용 분야·필요 데이터·규제 영향·도입 등급)
5. 업무영역별 라이브러리 (상품개발/위험률/언더라이팅/IFRS17/K-ICS/재보험/경영기획) + region·depth·track 필터
6. 검색·필터·태깅 (키워드, 분야, 도입 등급, 발행기관, 날짜, region, depth, track) — Postgres FTS + pg_trgm + 영-한 용어사전 자동 확장
7. 국내 **데이터** 카탈로그 (KOSIS, 통계청 생명표 등) — **통계 전용**으로 유지. 한국 논문·연구자료는 라이브러리 본체에서 처리
8. 관리자 검수 워크스페이스 — Diff 2창 동기 스크롤, 부분 재생성(스트리밍), 단축키(N/A/R/G)
9. 회원 가입·승인·피드백 처리 (회원 도메인 화이트리스트, 자료별 오류 신고 폼)
10. 도입 등급 5축 점수 산출(데이터 적합성·규제·상품·난이도·효과) + 분기별 가중치 회고
11. **자동 수집 관리** (`/admin/discovery`) — 스케줄 실행 이력, 신규 발견 URL 검토·승인 큐

### 1.5 기술 스택 및 제약조건
- **프레임워크**: Next.js 15 App Router, React 19, TypeScript
- **UI**: TweakCN (shadcn/ui 기반, tweakcn.com 테마 export → `globals.css` 수동 적용), Tailwind CSS v4
- **DB/Auth/Storage**: Supabase (PostgreSQL with RLS, Supabase Auth, Storage)
- **LLM**: Anthropic Claude Sonnet 4.6 (`claude-sonnet-4-6`) — 번역·요약·해석 전 영역. 한도 도달 시 Haiku 다운그레이드는 비채택, 큐 적재로 처리
- **파이프라인 실행**: Vercel Cron(스케줄·트리거) + Supabase Edge Function(백그라운드 LLM·파싱) + Supabase Realtime(상태 푸시)
- **분석**: Vercel Analytics(페이지뷰·Core Web Vitals) + Supabase `aik_event_log`(자료별 조회·태그 클릭·용어 클릭)
- **배포**: Vercel (Hobby/Pro), Supabase Pro
- **부가**: Recharts(통계 시각화·도입등급 레이더), KaTeX(짧은 수식 렌더링), Sonner(인앱 토스트)
- **폰트**: Noto Serif KR(헤드라인) + Pretendard(본문·UI) + JetBrains Mono(수치·코드 블록)

**제약조건**:
- 정확도 우선: LLM 단계마다 용어 사전 후처리 + **각 처리 깊이 단계 승격 시 관리자 검수 게이트 필수** (자동 게시·자동 승격 없음)
- **콘텐츠 수집 범위**: SOA Members-only 자료 게재 금지. 무료 공개 자료만 대상 (상세는 부록 C)
- **콘텐츠 트랙**: 자동 정기 수집(M2~), 관리자 큐레이션, 국내 자료 별도 수집의 3트랙. 사용자 제안은 시스템 UI 없이 이메일·외부 양식만
- 저작권: 원문 PDF는 자체 저장하지 않고 원본 URL만 보존. 공개 페이지에는 메타·요약·한국형 해석·일부 인용만, **번역 본문 전문은 로그인 회원 한정**
- 비용: LLM 일일 호출 상한(`LLM_DAILY_CALL_LIMIT`). 도달 시 후속 문서는 `aik_processing_queue`에 적재 후 익일 재개, 관리자 대시보드 인앱 알림
- 알림: 인앱 알림만(Supabase Realtime). 운영 이메일 미사용. 회원 가입·비밀번호 재설정 등 트랜잭셔널 메일은 Supabase Auth 기본 템플릿만 (Resend 미사용)
- 접근성: WCAG 2.1 AA 수준, 한국어 기본·영문 메타 병기, 다크 모드는 공개 페이지만 지원(관리자는 라이트 고정)
- 백업: Supabase Pro PITR(7일) + GitHub Actions가 매일 `aik_documents/translations/interpretations/glossary` CSV를 private repo에 커밋

### 1.6 도메인 용어 정의
| 용어 | 정의 |
|------|------|
| Mortality Experience Study | 보험사의 실제 사망경험 데이터를 기반으로 한 경험사망률 연구 |
| Mortality Improvement | 시간 경과에 따른 사망률 개선(감소) 추세 |
| Longevity Risk | 피보험자 기대여명이 가정을 초과하여 발생하는 위험 |
| Best Estimate | IFRS 17 체계에서 사용되는 최선 추정 가정 |
| K-ICS | 한국 신지급여력제도 (Korean Insurance Capital Standard) |
| Accelerated Underwriting | 데이터·예측모형 기반의 간소화 언더라이팅 |
| Persistency | 보험계약 유지율 |
| 도입 등급 | 본 플랫폼이 부여하는 실행 우선순위. `immediate`(즉시활용), `pilot`(파일럿), `internal_research`(내부연구), `monitoring`(모니터링)의 4단계. 5축 점수(데이터 적합성·규제·상품·난이도·효과)의 가중합으로 산출 |
| 도메인 화이트리스트 | 회원 가입 시 자동 1차 통과시키는 이메일 도메인 목록 (`MEMBER_DOMAIN_WHITELIST`). 국내 보험사·재보험사·감독원·계리법인·학교 등 |
| 무료 공개 자료 | 발행기관 사이트에서 비회원·비결제 상태로 즉시 다운로드 가능한 자료. SOA Members-only·결제형 리서치 미포함 |
| 부분 재생성 | 검수 페이지에서 관리자가 특정 단락을 선택해 Sonnet에 해당 부분만 재호출(스트리밍)하는 기능 |
| Members-only Source | SOA·CCC 등의 회원 전용 페이지 뒤에 있는 자료. 본 플랫폼 수집·게재 대상 외 |
| `depth_stage` | 자료의 처리 깊이 단계 enum: `registered`(메타만), `summarized`(한국어 요약 작성), `translated`(본문 번역 완료), `interpreted`(한국형 해석+도입방안 완성) |
| `region` | 자료 소속 지역 enum: `overseas`(해외), `domestic`(국내) |
| `track` | 자료 소싱 경로 enum: `auto_discovery`(저명 기관 자동 정기 수집), `admin_curated`(관리자 직접 등록), `email_submission`(외부 이메일·양식 제안 후 관리자 등록), `korea_curated`(국내 자료 큐레이션) |
| `discovery_method` | 자료 등록 방식: `auto`(스케줄러), `admin_manual`(관리자 직접), `email_submission`(외부 수의), `korea_seed`(국내 시드) |
| 저명 기관 (Reputable Source) | 자동 정기 수집 대상으로 등록 가능한 기관 — (i) 공식 학회·산업 협회·감독당국·대형 재보험사·국제기구·교수직 학자가 운영, (ii) 5년 이상 정기 출판물 보유, (iii) 인용·동료평가 등 품질 신호 존재 중 최소 2개 충족 |
| 자동 정기 수집 | Vercel Cron이 주기적으로(기본 주 1회) 등록된 소스의 목록/피드 페이지를 호출 → 셀렉터로 신규 URL 탐지 → `aik_discovery_runs`에 기록 → `aik_documents`에 `status='pending', track='auto_discovery'`로 후보 적재 → 관리자 승인 시 본 파이프라인 진입 |
| 외부 양식 제안 | 일반 사용자가 자료를 추천할 때 사용하는 이메일 주소 또는 Google Form 등 외부 양식 URL. about 페이지에 안내. 본 사이트에 별도 UI 신설 없음 |

---

## 2. 페이지 목록 및 사용자 흐름

### 2.1 페이지 목록

| 경로 | 페이지명 | 설명 | 인증 |
|------|---------|------|------|
| `/` | 랜딩 (홈) | 최신 자료 하이라이트, 주제별 진입, 통계 위젯 | 불필요 |
| `/library` | 자료 라이브러리 | 전체 자료 목록, 필터(region·depth·track·주제·도입등급·소스·날짜)·검색·정렬 (좌측 필터 패널 + 카드 그리드, 카드에 depth·region 인디케이터) | 불필요 |
| `/library/[slug]` | 자료 상세 | 한국형 해석(상단 고정) + 번역/원문 탭 + 관련 자료 + 국내데이터 매핑. `depth_stage`에 따라 표시 영역 자동 차등 (예: `summarized`는 해석·번역 탭 잠금) | 불필요 (번역 본문 전문은 회원 한정) |
| `/topics/[topic]` | 주제별 보기 | mortality / longevity / underwriting 등 | 불필요 |
| `/business-area/[area]` | 업무영역 보드 | 상품개발/위험률/언더라이팅별 큐레이션 | 불필요 |
| `/data-catalog` | 국내 데이터 카탈로그 | KOSIS·생명표·KIRI 등 외부 데이터 링크 | 불필요 |
| `/glossary` | 용어 사전 | 영-한 계리 용어 검색 | 불필요 |
| `/about` | 소개·운영 안내 | 플랫폼 목적, 데이터 출처, 면책고지, 콘텐츠 수집 정책, **자료 제안 안내(이메일·외부 양식 URL)** | 불필요 |
| `/auth/signup` | 회원 가입 | 이메일·이름 입력, 도메인 화이트리스트 자동 분류, 승인 대기 안내 | 불필요 |
| `/auth/login` | 회원 로그인 | Supabase Auth (이메일+비밀번호) | 불필요 |
| `/auth/pending` | 승인 대기 | 가입 신청 후 안내 페이지 | 불필요 |
| `/account/bookmarks` | 책갈피 | 회원이 저장한 자료 목록 | 회원 |
| `/account/filters` | 저장한 필터 | 도입등급·주제·업무영역 필터 프리셋 | 회원 |
| `/account/settings` | 계정 설정 | 비밀번호 변경, 표시 이름 | 회원 |
| `/admin/login` | 관리자 로그인 | Supabase Auth (이메일) | 불필요 |
| `/admin` | 관리자 대시보드 | 자료 처리 큐, 검수 대기, 인앱 알림 벨, 통계 | 관리자 |
| `/admin/sources` | 소스 관리 | 수집 소스 등록·주기 설정·인용 정책·region·track·자동 수집 스케줄·셀렉터 | 관리자 |
| `/admin/discovery` | 자동 수집 큐 | 스케줄 실행 이력(`aik_discovery_runs`), 신규 발견 URL 후보 → 승인·거절·수동 처리 | 관리자 |
| `/admin/documents` | 문서 관리 | URL 등록(트랙·깊이 선택), 파이프라인 트리거, 깊이 승격, 검수 진입 | 관리자 |
| `/admin/documents/[id]/review` | 문서 검수 | Diff 2창 동기 + 인라인 편집 + 부분 재생성 + 단축키(N/A/R/G) | 관리자 |
| `/admin/glossary` | 용어 사전 관리 | 표준 번역어 추가·수정 | 관리자 |
| `/admin/members` | 회원 관리 | 가입 신청 큐, 도메인 검증 결과, 승인·거절·차단 | 관리자 |
| `/admin/feedback` | 피드백 관리 | 자료별 오류 신고·이의 처리 | 관리자 |

### 2.2 사용자 흐름

**일반 방문자 (디스커버리 흐름)**:
```
랜딩 → 주제/업무영역 카드 클릭 → 자료 목록(좌측 필터) → 자료 상세
                                                      ├→ 한국형 해석 상단 고정 열람
                                                      ├→ 번역 본문 → "회원 로그인 시 전문 열람" CTA
                                                      ├→ 원문 사이트 외부 링크
                                                      ├→ 관련 자료 추천
                                                      ├→ 국내 데이터 링크
                                                      └→ 용어 사전 팝업
```

**회원 (활용 흐름)**:
```
가입 신청(/auth/signup) → 이메일·이름·소속 입력 → 도메인 화이트리스트 자동 분류
        ├→ 화이트리스트 일치: 관리자 대시보드 알림 우선순위 ↑
        └→ 외 도메인: 일반 신청 큐
                              ↓
                       관리자 승인 → 활성화 → 로그인
                              ↓
       자료 상세 번역 본문 전문 열람 / 책갈피 저장 / 필터 프리셋 저장 / 피드백 제출
```

**관리자 (콘텐츠 처리 흐름 — 깊이 단계 승격 기반)**:
```
로그인 → 대시보드(인앱 벨) → 문서 관리 → 자료 등록(URL + region + track + 목표 depth 선택)
                                      ↓ (Vercel Cron 또는 수동 트리거)
                              [Supabase Edge Function 백그라운드 실행]
                              0. depth_stage='registered' 즉시 부여 (메타 단계)
                              1. 크롤링·메타데이터 추출 (robots.txt 준수, 1rps, 403시 폴백)
                              ── 검수 게이트: registered 승인 → 라이브러리 메타 노출 ──
                              2. 요약 번역 (Sonnet) → depth_stage='summarized' 후보
                              ── 검수 게이트: summarized 승인 ──
                              3. 본문 파싱 + LLM 번역 + 용어 사전 후처리 → depth_stage='translated' 후보
                              ── 검수 게이트: translated 승인 ──
                              4. 한국형 해석 생성 + 도입 등급 5축 점수 + 면책 문구 → depth_stage='interpreted' 후보
                              ── 검수 게이트: interpreted 승인 → 도입방안 게시 ──
                                      ↓
                              ISR/SSG revalidate (각 단계 승인 시점에)
```
각 게이트에서 관리자는 ① 다음 단계로 승격, ② 단계 보류(현 단계로 게시 유지), ③ 단계 재생성, ④ archived 중 선택. 일부 자료는 의도적으로 `summarized` 또는 `translated`에서 멈춘다.

**자동 정기 수집 흐름 (M2~)**:
```
Vercel Cron (기본 주 1회, 월요일 00:00 KST)
        ↓
[Supabase Edge Function: discovery-scheduler]
        - track='auto_discovery', auto_crawl_schedule 일치 소스만 대상
        - 각 소스의 목록/피드 페이지 fetch (robots.txt 준수, 1rps)
        - discovery_selector_json 기반으로 항목 추출
        - 기존 aik_documents.original_url과 비교해 신규만 후보로
        - DISCOVERY_MAX_NEW_PER_RUN 상한 적용
        ↓
aik_discovery_runs 기록 (소스별 신규 N건, 실패 사유)
aik_documents에 status='pending', track='auto_discovery', depth_stage='registered'로 후보 적재
        ↓
관리자 인앱 알림 (`new_discovery_candidates`)
        ↓
/admin/discovery 큐 → 관리자가 후보별로 ① 등록·파이프라인 진입, ② 거절(아카이브 사유), ③ 보류
```

**관리자 (회원 승인 흐름)**:
```
가입 신청 발생 → 인앱 알림 → /admin/members 큐
                              ↓
                      도메인 자동 분류 결과 확인
                              ↓
                      이력·소속 검토 → 승인 / 거절 / 보류
                              ↓
                      신청자: 로그인 시 안내 (별도 이메일 통보 없음, Supabase 기본 메일만)
```

### 2.3 인증/권한 분기

| 라우트 그룹 | 미들웨어 처리 |
|-----------|--------------|
| `(public)/*` | 누구나 접근 가능 (anon 권한) |
| `(public)/library/[slug]` | 누구나 접근 가능. 단 번역 본문 전문은 Server Component에서 회원 세션 검사 후에만 렌더 |
| `(member)/*` | Supabase 세션 + `aik_members.status='active'` 확인, 미인증 시 `/auth/login` 리다이렉트 |
| `(admin)/*` | Supabase 세션 + `aik_admin_users` 확인, 미인증·미등록 시 `/admin/login` 리다이렉트 |
| `api/admin/*` | Supabase 서비스 키 또는 관리자 세션 검증 |
| `api/member/*` | 회원 세션 검증 (책갈피·필터 저장·피드백 제출) |
| `api/public/*` | Rate limiting만 적용 |

권한 모델은 `anon < member < admin` 3-tier. RLS는 anon에 메타·요약·태그·용어사전 read를, member에 추가로 번역 본문·관련 책갈피·저장 필터를, admin에 전체 read/write를 부여 (자세한 정책은 3.4).

### 2.4 데이터 흐름

```
[관리자가 URL 등록]
        ↓
[크롤러 (서버사이드)] — 원문 HTML/PDF 가져오기
        ↓
[파서 스킬] — 본문·메타데이터 추출
        ↓
[Supabase: documents 테이블 INSERT (status=processing)]
        ↓
[번역 에이전트 호출 (Sonnet)] — 용어 사전 컨텍스트 주입
        ↓
[용어 후처리 스크립트] — 표준 번역어 치환
        ↓
[해석 에이전트 호출 (Sonnet)] — 한국형 적용성·규제·우선순위 생성
        ↓
[Supabase: translations, interpretations 테이블 INSERT]
        ↓
[status=review_pending → 관리자 검수 → status=published]
        ↓
[공개 페이지에서 조회 가능]
```

### 2.5 LLM 판단 영역과 코드 처리 영역

| LLM(Sonnet) 판단 영역 | 코드/스크립트 처리 영역 |
|---------------------|----------------------|
| 원문 번역 (문맥 고려) | URL 크롤링, HTML/PDF 파싱 |
| 핵심 문장 추출·요약 | 메타데이터 정규화 (날짜, 기관명) |
| 한국 적용 가능성 평가 텍스트 작성 | 용어 사전 매칭·치환 |
| 필요한 국내 데이터 제안 | DB CRUD, RLS 정책 |
| 규제 영향 해설 | 도입 등급 점수 합산 (가중치 룰) |
| 관련 자료 추천 근거 | 검색 인덱싱, 태그 카운팅 |
| 업무영역 태깅 후보 | Supabase 트랜잭션, 큐 관리 |

### 2.6 성공 기준 및 검증 방법

| 단계 | 성공 기준 | 검증 방법 | 실패 시 |
|------|---------|---------|--------|
| 콘텐츠 수집 정책 | Members-only flag = false, 무료 공개 자료 | URL 등록 시 관리자 확인 + 자동 페이지 검사 | 등록 거부, 관리자 노트 |
| 크롤링 | HTTP 200, 본문 길이 > 500자, robots.txt 허용 | 규칙 기반 (User-Agent 명시, 도메인별 1rps) | 자동 재시도 3회 → 403/차단 시 관리자 인앱 알림 → 수동 PDF 업로드 폴백 |
| 메타데이터 파싱 | 제목·발행일·출처 모두 존재 | 규칙 기반 | 폴백: 관리자 수동 입력 폼 |
| LLM 번역 | 용어 사전 표준어 일치율 ≥ 90% | LLM 자기 검증 + 규칙 | 자동 재시도 2회 → 검수 큐 적재 |
| 번역 캐시 | 문장 해시 hit 시 기존 번역 재사용 | `aik_translation_cache` 조회 | miss는 LLM 호출 |
| 한국형 해석 | 5개 필수 항목(요약·적용·데이터·규제·우선순위) 모두 생성 + 규제 항목에 면책 문구 부착 | 스키마 검증 (Zod) | 자동 재시도 1회 → 관리자 보완 |
| LLM 일일 호출 한도 | `LLM_DAILY_CALL_LIMIT` 미달 | 호출 카운터 | 한도 도달 시 큐 적재(`pending_quota_reset`) → 익일 재개 + 인앱 알림 |
| 검수 처리량 SLA | 회원 활성화·자료 게시 모두 영업일 7일 이내 | `aik_audit_log` 타임스탬프 분석 | 7일 초과 큐 우선순위 ↑, 대시보드 경고 |
| 페이지 빌드 | TypeScript 오류 0, Lighthouse ≥ 90 | 규칙 기반 (CI) | 자동 재시도 → 폴백 UI |
| 디자인 일관성 | TweakCN 토큰만 사용, 임의 색상 0 | LLM 자기 검증 | 사람 검토 |
| MVP 시드 분량 | M1 출시 시점에 SOA 10건 + KIRI 5건 published | 관리자 대시보드 통계 | 누락 자료 게시 보강 |
| 깊이 단계별 SLA | `registered` 등록 후 영업일 2일 이내 1차 검수, `summarized` 추가 2일, `translated` 추가 3일, `interpreted` 추가 4일 (단계별 누적) | 큐 타임스탬프 | 초과 시 큐 우선순위 ↑ |
| 자동 수집 캐치율 | 등록된 저명 기관의 신규 발행 자료 중 90% 이상을 다음 정기 실행에서 후보로 잡음 | 분기 회고 시 소스별 발행 vs `aik_discovery_runs` 비교 | 셀렉터·스케줄 튜닝 |
| `depth_stage` 분포 | M3 시점에 published 자료 중 `interpreted` ≥ 30%, `summarized` 이상 ≥ 80% | 대시보드 깊이 분포 위젯 | 큐레이션 우선순위 조정 |

---

## 3. 데이터 모델 (Supabase)

테이블 prefix: `aik_` (Actuarial Intel Korea)

### 3.1 테이블 목록

| 테이블명 | 설명 | RLS | 실시간 |
|---------|------|-----|--------|
| `aik_sources` | 수집 소스 마스터 (SOA, KIRI, KOSIS, 학회 등) + `quotation_policy`/`region`/`track`/`auto_crawl_schedule`/`discovery_selector_json` | ✅ 관리자만 쓰기, 누구나 읽기 | - |
| `aik_discovery_runs` | 자동 정기 수집 실행 기록 (소스별 실행 시각·신규 N건·실패 사유) | ✅ 관리자만 | ✅ (대시보드) |
| `aik_documents` | 자료 메타데이터, 버전 체인(`parent_document_id`), `is_members_only_source` flag, `depth_stage`, `region`, `track`, `discovery_method`, `submitted_via_note` | ✅ published 메타·요약만 anon 읽기, depth_stage>=translated 본문은 member, depth_stage=interpreted 도입방안은 anon에 요약/적용/우선순위만, archived는 admin | ✅ (관리자 큐) |
| `aik_translations` | 번역 본문 (버전 관리) | ✅ published만 member 이상 읽기 | - |
| `aik_interpretations` | 한국형 해석 (요약·적용·규제·우선순위) — 규제 항목에 면책 문구 고정 | ✅ published만 anon 읽기 (요약·적용·우선순위), member는 전체 | - |
| `aik_translation_cache` | 문장 해시 → 표준 번역 (TM Lite) | ✅ 관리자만 | - |
| `aik_glossary` | 영-한 계리 용어 사전 | ✅ 누구나 읽기, 관리자만 쓰기 | - |
| `aik_tags` | 태그 마스터 (자유 태그, 관리자 승인 후 표시) | ✅ 누구나 읽기, admin 쓰기 | - |
| `aik_document_tags` | 문서-태그 매핑 | ✅ | - |
| `aik_korea_data_sources` | 국내 데이터 카탈로그 (KOSIS 링크 등) | ✅ 누구나 읽기 | - |
| `aik_document_korea_data` | 문서-국내데이터 연결 (LLM 추천 후 관리자 검수) | ✅ | - |
| `aik_processing_queue` | 파이프라인 처리 큐·상태(`pending`, `processing`, `pending_quota_reset`, `review_pending`, `failed`) | ✅ 관리자만 | ✅ |
| `aik_members` | 회원 마스터: 이메일·이름·신청 시 소속(선택)·도메인 분류 결과·상태(`pending`/`active`/`rejected`/`suspended`) | ✅ 본인은 자기 행 읽기, 관리자는 전체 | ✅ (관리자 큐) |
| `aik_bookmarks` | 회원 책갈피 | ✅ 본인만 | - |
| `aik_saved_filters` | 회원 저장 필터 (도입등급·주제·업무영역 조합) | ✅ 본인만 | - |
| `aik_feedback` | 자료별 오류 신고·이의 (회원 제출) | ✅ 본인 + 관리자 | ✅ (관리자) |
| `aik_event_log` | 자료 조회·태그 클릭·용어 클릭 등 익명 이벤트 (큐레이션 분석용) | ✅ 관리자만 read | - |
| `aik_admin_users` | 관리자 화이트리스트 | ✅ 관리자만 | - |
| `aik_audit_log` | 검수·수정·승인 이력 | ✅ 관리자만 | - |
| `aik_notifications` | 관리자 인앱 알림 (파이프라인 실패·신규 회원·LLM 한도 등) | ✅ 관리자만 | ✅ |

### 3.2 주요 관계 (ERD 개요)

```
aik_sources (1) ─< aik_documents (N) ─< aik_documents (자식 버전, parent_document_id)
                       │
                       ├─< aik_translations (N, 버전)
                       ├─< aik_interpretations (1)
                       ├─< aik_document_tags >─ aik_tags
                       ├─< aik_document_korea_data >─ aik_korea_data_sources
                       ├─< aik_processing_queue (이력)
                       ├─< aik_bookmarks >─ aik_members
                       ├─< aik_feedback >─ aik_members
                       └─< aik_event_log

aik_members (1) ─< aik_saved_filters (N)
aik_translations ─< aik_translation_cache (문장 해시 매핑)
```

### 3.3 핵심 필드 개요 (상세 스키마는 `/docs/domain/schema.md`에 ERD 형태로 작성)

- `aik_sources`: id, name, base_url, organization, `region` (`overseas|domestic`), `track` (`auto_discovery|admin_curated|korea_curated`), `quotation_policy` (`metadata_only|summary_with_quote|public_full`), `members_only_default` boolean, robots_check_passed, `auto_crawl_schedule` (cron 문자열, nullable), `discovery_selector_json` (목록 페이지 selector spec, nullable), `last_discovery_at`, `is_reputable` (자동 수집 대상 여부)
- `aik_discovery_runs`: id, source_id, started_at, finished_at, candidates_found, candidates_new, candidates_rejected_reason_json, status (`success|partial|failed`), error_message
- `aik_documents`: id, source_id, original_url, title, title_ko, original_lang, published_at, fetched_at, status (`pending|processing|pending_quota_reset|review_pending|published|archived|rejected`), `depth_stage` (`registered|summarized|translated|interpreted`), `target_depth_stage` (관리자가 목표로 정한 단계), `region` (소스에서 상속), `track` (소스에서 상속하되 override 가능), `discovery_method` (`auto|admin_manual|email_submission|korea_seed`), `submitted_via_note` (이메일 제안의 발신자·날짜 메모, nullable), slug, primary_topic (enum), business_areas[] (enum 다중), adoption_grade (`immediate|pilot|internal_research|monitoring`, depth_stage=interpreted일 때만), adoption_axes (jsonb: `{data, regulation, product, difficulty, effect}`), `parent_document_id`(nullable, 수정판 체인), `is_members_only_source` (true면 게재 거부), errata_note
- `aik_translations`: id, document_id, version, content_md, glossary_match_rate, created_by (`llm|admin`), reviewed_by, reviewed_at, llm_model_used, cache_hit_rate
- `aik_translation_cache`: id, sentence_hash, source_text, translated_text, glossary_terms_used[], first_seen_document_id, hit_count
- `aik_interpretations`: id, document_id, summary_ko, korea_applicability, required_korea_data, regulatory_impact (텍스트 + 면책 문구 자동 부착), regulatory_disclaimer_version, target_departments[], adoption_difficulty, adoption_notes
- `aik_glossary`: id, term_en, term_ko_standard, term_ko_alternatives[], definition_ko, usage_examples[], domain
- `aik_members`: id, auth_user_id (Supabase auth.users 참조), email, display_name, domain_classification (`whitelist|other|blocked`), status, approved_by, approved_at, last_login_at
- `aik_bookmarks`: id, member_id, document_id, note, created_at
- `aik_saved_filters`: id, member_id, name, filter_json, created_at
- `aik_feedback`: id, document_id, member_id, category (`translation_error|interpretation_error|regulation_concern|other`), body, status (`open|in_review|resolved|rejected`), admin_note
- `aik_event_log`: id, event_type (`view_document|click_tag|click_term|click_external|search`), target_id, anon_session_hash, occurred_at
- `aik_notifications`: id, type (`pipeline_failed|llm_quota_reached|new_member|new_feedback|crawler_blocked`), payload_json, read_at

### 3.4 RLS 정책 원칙
- **anon 읽기**: `aik_documents`(메타·`depth_stage`·`region`·`track`·요약·태그 컬럼만), `aik_interpretations`(요약·적용·우선순위만, `depth_stage='interpreted'` 자료에 한정), `aik_glossary`, `aik_tags`, `aik_korea_data_sources`는 `status='published'` AND `published_at IS NOT NULL` 조건일 때만 SELECT 허용. **번역 본문 전문 및 `regulatory_impact` 전체는 anon 거부**. `depth_stage='registered'` 자료는 메타만, `summarized` 이상은 추가로 요약 노출
- **member 읽기**: `aik_members.status='active'` 보유자에 한해 위 anon 영역 + `aik_translations.content_md`(`depth_stage>='translated'` 자료에서) + `aik_interpretations` 전체(`depth_stage='interpreted'` 자료에서) + 본인의 `aik_bookmarks`/`aik_saved_filters`/`aik_feedback` 접근
- **member 쓰기**: 본인 행에 한해 `aik_bookmarks`, `aik_saved_filters`, `aik_feedback` INSERT/UPDATE/DELETE
- **admin 쓰기**: `aik_admin_users` 테이블에 등록된 `auth.uid()` 보유자만 모든 INSERT/UPDATE/DELETE (`aik_event_log`는 익명 INSERT 허용, 시스템 트리거 경로)
- **감사 추적**: 모든 관리자 변경은 `aik_audit_log`에 트리거로 자동 기록 (회원 승인·거절, 검수 변경, 게시 승인 포함)
- **콘텐츠 게재 제약**: `aik_documents.is_members_only_source = true`인 행은 모든 역할에서 SELECT 결과 제외 (게재 정책 위반 방지). 등록 단계에서 자동 차단

### 3.5 인증 흐름
- Supabase Auth (이메일+패스워드) 사용, 소셜 로그인 미사용
- **회원 가입**: `/auth/signup` 폼 → Supabase Auth 사용자 생성 (이메일 검증 메일은 Supabase 기본 템플릿) → `aik_members`에 `status='pending'`, `domain_classification` 자동 계산 (`MEMBER_DOMAIN_WHITELIST` 일치 시 whitelist) → 관리자 인앱 알림 `new_member`
- **관리자 승인**: `/admin/members`에서 `approve` 액션 → `aik_members.status='active'`, `approved_at`/`approved_by` 기록, 감사 로그 남김. 별도 알림 메일 없음 — 회원이 다음 로그인 시 활성 상태 인지
- **관리자 화이트리스트**: 회원 일반 가입과 분리. Supabase 콘솔에서 직접 사용자 생성 후 `aik_admin_users` INSERT
- **세션 관리**: Next.js Server Component에서 `@supabase/ssr` 사용, 미들웨어로 `(member)`·`(admin)` 그룹 보호

---

## 4. UI/UX 설계 방향

### 4.1 디자인 톤 및 근거
**선택: 에디토리얼 + 다크 테크 하이브리드**

- **에디토리얼**: 계리·연구 자료라는 콘텐츠 중심 성격, 긴 본문 가독성, 출처·날짜·태그가 신문 기사처럼 명확히 드러나야 함
- **다크 테크 요소**: 전문직(계리사·리스크관리자) 타깃, 장시간 열람, 금융·SaaS 톤과 일관성
- 결합 방식: **밝은 모드를 기본**으로 하되 다크 모드 토글 제공, 타이포그래피는 에디토리얼(세리프 헤드라인 + 산세리프 본문) 채택, 차트·통계 위젯은 다크 테크 룩 적용

### 4.2 컬러·폰트 토큰 (TweakCN 커스터마이즈)

**폰트 (Tailwind v4 `--font-*` 토큰)**:
```
--font-serif        : "Noto Serif KR", "IBM Plex Serif", serif        — 헤드라인·자료 제목
--font-sans         : "Pretendard Variable", "Inter", sans-serif      — 본문·UI·버튼
--font-mono         : "JetBrains Mono", ui-monospace, monospace       — 수치·코드·표 데이터
```
로드 전략: `next/font/google` (Noto Serif KR, JetBrains Mono) + Pretendard는 cdn.jsdelivr 정적 호스팅 또는 self-host. 글로벌 `body`에 `font-sans`, 헤드라인 컴포넌트에 `font-serif`.

**컬러 토큰**:
```
--background        : 화이트 (#FAFAF8 — 약간의 웜톤)
--foreground        : 다크 차콜 (#1A1A1A)
--primary           : 딥 네이비 (#0F2A4A) — 신뢰·금융
--accent            : 머스타드 (#C89B3C) — 강조·도입등급 즉시활용
--accent-secondary  : 코랄 #C25450 (파일럿) / 슬레이트 #6B7280 (내부연구) / 라이트 슬레이트 #B1B5BB (모니터링)
--muted             : 라이트 그레이 (#F0EFEB)
--border            : 1px solid (#E5E3DC)
--destructive       : 적색 #B0413E (검수 반려·피드백 거절)
다크 모드(공개 페이지 전용): --background #0E1116, --foreground #E8E6E1, --primary 유지, 차트는 다크 친화 팔레트로 자동 전환
```

**TweakCN 워크플로**: tweakcn.com에서 위 토큰으로 테마 생성 → export된 CSS를 `app/globals.css`의 `@layer base` 블록에 수동 붙여넣기. 이후 shadcn CLI(`npx shadcn add ...`)로 컴포넌트 추가 시 `components.json`의 base color를 변경된 토큰에 맞춤.

### 4.3 핵심 컴포넌트 및 TweakCN 커스터마이징

| 컴포넌트 | 역할 | 커스터마이징 방향 |
|---------|------|----------------|
| `Card` | 자료 카드, 데이터 소스 카드 | 라운딩 축소(4px), border 1px solid, hover 시 미세 lift, 상단 우측에 도입등급 아이콘 배지 + 우상단 코너에 `DepthBadge` 4-dot + 좌상단에 `RegionPill` |
| `Badge` | 도입 등급, 업무영역 태그 | 등급별 4종 토큰 + 아이콘(⚡즉시활용 / 🧪파일럿 / 📚연구 / 👀모니터링), 둥근 사각 |
| `DepthBadge` | 자료의 4단계 처리 깊이 시각 | 4-dot 인디케이터 (●○○○ registered / ●●○○ summarized / ●●●○ translated / ●●●● interpreted). 카드·헤더에 8px 크기, 자료 상세에 라벨 포함 큰 크기 |
| `RegionPill` | 자료의 region(overseas/domestic) 작은 배지 | "해외 EN" / "국내 KR" 8pt 텍스트, 좌상단 코너. 다크모드 자동 대응 |
| `TrackChip` | 자료의 소싱 트랙 표시 (관리자·상세 페이지) | "정기수집" / "큐레이션" / "이메일 제안" / "국내" 텍스트 칩. 공개 페이지 카드에는 노출 X (관리자·세부에서만) |
| `RadarChart` (Recharts) | 자료 상세 도입등급 5축 점수 | `data/regulation/product/difficulty/effect` 5축, 면적 채움(accent 25%), 외부 라벨 작게 |
| `Button` | 액션 버튼 | 라운딩 4px, font-weight 600, primary는 솔리드/secondary는 outline |
| `Input` / `Command` | 검색 입력 | 큰 검색바 (랜딩), 좌측 아이콘, 단축키 표시 (⌘K). 결과는 자료/태그/용어/명령 4구역 그룹화 |
| `Tabs` | 자료 상세 (번역/원문) | 한국형 해석이 상단 고정 후 그 아래 탭, 언더라인 스타일, 비회원에 번역 탭은 잠금 아이콘 + CTA |
| `Table` | 관리자 문서 목록·회원 목록·피드백 목록 | 조밀한 행 높이, 정렬 화살표, 상태 컬럼 색상 |
| `Sheet` / `Dialog` | 모바일 필터, 용어 사전 팝업 | 우측 슬라이드, 화면 50% 폭. 모바일 필터는 하단 시트 |
| `DiffEditor` (검수 전용) | 원문↔번역 2창 동기 스크롤 + 인라인 편집 + 부분 선택 → 재생성 스트리밍 | 단축키 N(다음 의심)/A(승인)/R(재생성)/G(용어상자), 의심 구간 하이라이트 |
| `Toast` (Sonner) | 파이프라인 진행·검수 액션·LLM 한도 알림 | 우상단, 진행률 표시 |
| `Skeleton` | 자료 로딩 | 카드 형태 골격 |
| `Tooltip` | 용어 hover 시 영-한 매핑 | 본문 내 영문 용어에 점선 underline |
| `NotificationBell` (관리자) | 인앱 알림 벨 | 상단 헤더 우측, 미읽음 dot, 클릭 시 Sheet에 목록 |

### 4.4 반응형 브레이크포인트
- **모바일** (< 768px): 1단 레이아웃, 라이브러리 필터는 하단 Sheet, 헤더는 햄버거 메뉴 + Sheet. 관리자 페이지는 **읽기 전용 요약·큐 조회만**, 편집·검수는 데스크톱 전환 안내 배너
- **태블릿** (768-1024px): 2단 (좌측 필터 + 본문)
- **데스크톱** (≥ 1024px): 라이브러리 3단 (좌측 필터 + 카드 그리드 + 우측 TOC/관련자료), 자료 상세 2단 (본문 + 우측 TOC). 최대 폭 1280px
- **와이드** (≥ 1536px): 본문 폭 유지하고 여백 확대

**메인 네비게이션 (IA)**:
- 상단 헤더: 로고 / 라이브러리 / 주제 / 업무영역 / 데이터 / 용어 / 소개 / ⌘K / 로그인 (또는 계정 메뉴)
- 좌측 사이드 필터는 `/library` 안에서만 노출. 필터 그룹: **Region**(해외/국내), **Depth**(메타·요약·번역·해석), **Track**(공개 라이브러리에서는 숨김 가능, 관리자만 노출 검토), 주제·업무영역·도입등급·소스·날짜·태그
- 모바일은 헤더 햄버거 → Sheet, 라이브러리 필터는 하단 Sheet

### 4.5 애니메이션·인터랙션 방향
- **절제된 모션**: framer-motion으로 페이지 전환 시 fade(150ms), 카드 hover 시 translateY(-2px)
- **로딩 상태**: Skeleton + 진행률 (특히 LLM 처리 중인 관리자 페이지)
- **본문 인터랙션**: 영문 용어 hover → 한국어 정의 툴팁, 클릭 시 용어 사전 페이지로
- **검색**: ⌘K 글로벌 검색 (cmdk 기반 Command 팔레트)
- **금지사항**: 화려한 패럴랙스, 자동 재생 캐러셀, 과도한 scroll trigger 애니메이션

### 4.6 디자인 레퍼런스 톤
- 콘텐츠·타이포: Stripe Press, MIT Technology Review, The Browser
- 데이터 UI: Linear Insights, Vercel Dashboard
- 금융 신뢰감: Munich Re Research, Swiss Re Sigma 리포트 페이지

---

## 5. 구현 스펙

### 5.1 폴더 구조

```
/actuarial-intel-korea
  ├── CLAUDE.md
  ├── .claude/
  │   ├── skills/
  │   │   ├── document-crawler/
  │   │   │   ├── SKILL.md
  │   │   │   ├── scripts/         # HTML/PDF 파싱, 메타데이터 추출
  │   │   │   └── references/      # 소스별 셀렉터 가이드 (SOA, KIRI 등)
  │   │   ├── glossary-postprocess/
  │   │   │   ├── SKILL.md
  │   │   │   ├── scripts/         # 표준 번역어 치환 스크립트
  │   │   │   └── references/      # 용어 사전 운영 가이드
  │   │   ├── adoption-grade-scorer/
  │   │   │   ├── SKILL.md
  │   │   │   └── scripts/         # 도입 등급 가중치 계산
  │   │   └── supabase-query/
  │   │       └── SKILL.md
  │   └── agents/
  │       ├── ui-builder/
  │       │   └── AGENT.md
  │       ├── db-architect/
  │       │   └── AGENT.md
  │       ├── api-designer/
  │       │   └── AGENT.md
  │       └── content-pipeline/
  │           └── AGENT.md         # 번역·해석 LLM 파이프라인 전담
  ├── app/
  │   ├── (public)/
  │   │   ├── layout.tsx           # 공개 레이아웃 (헤더, 푸터, 다크모드 토글)
  │   │   ├── page.tsx             # 랜딩
  │   │   ├── library/
  │   │   │   ├── page.tsx
  │   │   │   └── [slug]/page.tsx
  │   │   ├── topics/[topic]/page.tsx
  │   │   ├── business-area/[area]/page.tsx
  │   │   ├── data-catalog/page.tsx
  │   │   ├── glossary/page.tsx
  │   │   ├── about/page.tsx
  │   │   └── auth/
  │   │       ├── signup/page.tsx
  │   │       ├── login/page.tsx
  │   │       └── pending/page.tsx
  │   ├── (member)/
  │   │   ├── layout.tsx           # 회원 레이아웃 (계정 메뉴)
  │   │   └── account/
  │   │       ├── bookmarks/page.tsx
  │   │       ├── filters/page.tsx
  │   │       └── settings/page.tsx
  │   ├── (admin)/
  │   │   ├── layout.tsx           # 관리자 레이아웃 (사이드바, 알림 벨, 라이트 고정)
  │   │   ├── admin/
  │   │   │   ├── page.tsx
  │   │   │   ├── sources/page.tsx
  │   │   │   ├── documents/
  │   │   │   │   ├── page.tsx
  │   │   │   │   └── [id]/review/page.tsx
  │   │   │   ├── glossary/page.tsx
  │   │   │   ├── members/page.tsx
  │   │   │   ├── discovery/page.tsx           # 자동 수집 큐
  │   │   │   └── feedback/page.tsx
  │   │   └── login/page.tsx
  │   ├── api/
  │   │   ├── og/[slug]/route.ts             # 동적 OG 이미지 (ImageResponse)
  │   │   ├── sitemap.xml/route.ts           # 자동 sitemap
  │   │   ├── public/
  │   │   │   ├── search/route.ts
  │   │   │   ├── documents/[slug]/route.ts
  │   │   │   └── event/route.ts             # aik_event_log 익명 기록
  │   │   ├── member/
  │   │   │   ├── bookmarks/route.ts
  │   │   │   ├── saved-filters/route.ts
  │   │   │   └── feedback/route.ts
  │   │   └── admin/
  │   │       ├── pipeline/trigger/route.ts   # Supabase Edge Function 호출
  │   │       ├── pipeline/status/[id]/route.ts
  │   │       ├── translate/regenerate/route.ts   # 부분 재생성 스트리밍
  │   │       ├── members/[id]/approve/route.ts
  │   │       ├── discovery/trigger/route.ts      # 수동 자동 수집 실행
  │   │       ├── discovery/review/route.ts       # 후보 승인·거절
  │   │       ├── documents/[id]/promote/route.ts # depth_stage 승격
  │   │       ├── publish/route.ts
  │   │       └── revalidate/route.ts             # ISR/SSG on-demand revalidate
  │   ├── layout.tsx
  │   └── globals.css                  # TweakCN export 토큰 적용
  ├── supabase/
  │   ├── functions/
  │   │   ├── pipeline-run/index.ts            # Edge Function: 크롤+파싱+LLM 백그라운드
  │   │   ├── translation-cache-warm/index.ts
  │   │   └── discovery-scheduler/index.ts     # 자동 정기 수집 (Cron 트리거)
  │   └── migrations/                  # SQL 마이그레이션
  ├── components/
  │   ├── ui/                      # TweakCN 기본
  │   ├── document/                # DocumentCard, DocumentTabs, AdoptionBadge
  │   ├── library/                 # FilterPanel, SearchBar, TopicGrid
  │   ├── admin/                   # PipelineStatus, ReviewEditor, GlossaryTable
  │   └── shared/                  # Header, Footer, GlossaryTooltip
  ├── lib/
  │   ├── supabase/
  │   │   ├── client.ts            # Browser client
  │   │   ├── server.ts            # Server Component client
  │   │   ├── middleware.ts        # Auth middleware helper
  │   │   └── queries/             # 도메인별 쿼리 함수
  │   ├── anthropic/
  │   │   ├── client.ts            # Anthropic SDK 래퍼
  │   │   ├── prompts/
  │   │   │   ├── translation.ts   # 번역 프롬프트 + 용어 사전 주입
  │   │   │   ├── interpretation.ts # 한국형 해석 프롬프트
  │   │   │   └── summarize.ts
  │   │   └── schemas.ts           # Zod 스키마 (LLM 출력 검증)
  │   ├── pipeline/
  │   │   ├── orchestrator.ts      # 단계별 실행 + 재시도 + 폴백
  │   │   └── steps/               # crawl → parse → translate → interpret → score
  │   └── utils/
  ├── types/
  │   ├── database.ts              # Supabase 생성 타입
  │   └── domain.ts                # AdoptionGrade, BusinessArea 등
  ├── output/                      # 에이전트 중간 산출물 (커밋 제외)
  └── docs/
      ├── references/
      │   ├── design-tokens.md
      │   ├── soa-source-guide.md
      │   └── kosis-api.md
      └── domain/
          ├── schema.md            # ERD
          ├── glossary-seed.md     # 초기 용어 사전 시드
          ├── adoption-grade-rubric.md
          └── korea-data-catalog.md
```

### 5.2 CLAUDE.md 핵심 섹션 (구조만)

1. 프로젝트 개요 및 기술 스택 요약
2. 디렉토리 맵 (어디에 무엇이 있는지)
3. 핵심 도메인 용어 (간결 정의 + glossary-seed.md 참조)
4. 라우트 그룹 규칙 ((public) vs (admin))
5. 데이터 흐름 (파이프라인 단계 요약)
6. 서브에이전트 호출 규칙 (직접 호출 금지, 메인 경유)
7. LLM 호출 정책 (모델, 온도, 재시도, 비용 상한)
8. 검증·실패 처리 게이트
9. 작업 시작 전 체크리스트

### 5.3 에이전트 구조

**서브에이전트 분리 채택 (4개)**

근거:
- 페이지 수 14개, 데이터 모델 12개 테이블, LLM 파이프라인 다단계 → 단일 에이전트 컨텍스트로 다루기 부담
- 역할이 명확히 분리됨: UI, DB, API, LLM 파이프라인
- 도메인 레퍼런스 분리 효율적 (UI는 디자인 토큰, DB는 스키마, 콘텐츠는 프롬프트·용어사전)

| 서브에이전트 | 역할 | 트리거 조건 | 주요 입출력 | 참조 |
|------------|------|-----------|-----------|------|
| `ui-builder` | TweakCN 컴포넌트 생성, 페이지 레이아웃, 반응형 | 새 페이지/컴포넌트 구현 시 | 입력: 페이지 스펙·디자인 토큰 / 출력: `app/`·`components/` 파일 | `docs/references/design-tokens.md` |
| `db-architect` | Supabase 스키마, RLS, 마이그레이션, 타입 생성 | 데이터 모델 변경·신규 테이블 | 입력: ERD·필드 정의 / 출력: SQL 마이그레이션, `types/database.ts` | `docs/domain/schema.md` |
| `api-designer` | Route Handler, Server Action, 미들웨어 | 백엔드 엔드포인트 구현 시 | 입력: API 명세·인증 요구사항 / 출력: `app/api/*` | `docs/references/*` |
| `content-pipeline` | LLM 번역·해석·요약 프롬프트, Zod 스키마, 재시도 로직 | 파이프라인 단계 변경·프롬프트 튜닝 | 입력: 원문·용어사전·해석 루브릭 / 출력: `lib/anthropic/*`, `lib/pipeline/*` | `docs/domain/glossary-seed.md`, `adoption-grade-rubric.md` |

**데이터 전달 방식**: 메인이 오케스트레이터, 서브에이전트 간 직접 호출 금지. 중간 산출물은 `/output/`에 JSON으로 저장 (예: `output/step1_schema.json`, `output/step2_routes.json`) 후 다음 에이전트에 경로 전달.

### 5.4 스킬 목록

| 스킬명 | 역할 | 트리거 조건 |
|-------|------|-----------|
| `document-crawler` | URL → HTML/PDF 본문·메타데이터 추출 (소스별 셀렉터 보유, robots.txt 준수, User-Agent 명시, 1rps) | 관리자가 새 문서 URL 등록 시 |
| `pdf-extractor` | PDF 텍스트 추출 + 수식 영역 이미지 캡처(좌표 보존) + 표 영역 LLM 구조화 입력 준비 | 크롤링 직후 |
| `glossary-postprocess` | LLM 번역 결과에 표준 번역어 치환·일치율 측정 + 문장 캐시 hit 처리 | 번역 단계 직후 자동 실행 |
| `adoption-grade-scorer` | 데이터 적합성·규제·상품·난이도·효과 5축 점수 → 등급 산출 | 해석 단계 직후 |
| `regulatory-disclaimer-injector` | `interpretations.regulatory_impact` 끝에 고정 면책 문구 자동 부착 | 해석 저장 직전 |
| `supabase-query` | 도메인별 공통 쿼리 (published documents, by topic, by area, by member) | 페이지 컴포넌트가 데이터 필요 시 |
| `member-domain-classifier` | 가입 신청 이메일 도메인을 `MEMBER_DOMAIN_WHITELIST`와 대조 → `whitelist`/`other`/`blocked` 라벨 | 회원 가입 시점 |
| `discovery-feed-parser` | 등록된 소스의 목록/피드 페이지에서 신규 자료 URL·메타 후보 추출 (`discovery_selector_json` 또는 RSS/Atom 자동 감지) | Vercel Cron 트리거 또는 관리자 수동 트리거 시 |
| `depth-stage-promoter` | 다음 깊이 단계로 승격 시 필요한 LLM 호출(요약→번역→해석)을 단계별로 트리거 + Zod 스키마 검증 | 검수 페이지에서 관리자가 단계 승격 액션 시 |

스킬은 **여러 서브에이전트가 공유**하는 도구 단위, 서브에이전트는 **역할 단위**로 구분.

### 5.5 페이지·컴포넌트별 처리 방식

| 대상 | 처리 방식 |
|------|---------|
| 공개 페이지 (랜딩, 라이브러리, 상세) | `ui-builder` 에이전트가 페이지·컴포넌트 생성, `supabase-query` 스킬로 데이터 페칭 |
| 관리자 페이지 | `ui-builder` + `api-designer` 협업, 실시간 큐는 Supabase Realtime 구독 |
| Route Handlers | `api-designer` 에이전트 전담 |
| DB 스키마·마이그레이션 | `db-architect` 에이전트 전담, 보일러플레이트 SQL은 스크립트 |
| LLM 파이프라인 | `content-pipeline` 에이전트, Zod 스키마는 스크립트 |
| 타입 정의 | `supabase gen types typescript` 자동 생성 + 도메인 enum은 수동 |

### 5.6 주요 산출물 파일 형식

| 산출물 | 형식 | 위치 |
|-------|------|------|
| 자료 메타데이터 | PostgreSQL row | `aik_documents` |
| 번역 본문 | Markdown (DB 텍스트 컬럼) | `aik_translations.content_md` |
| 한국형 해석 | 구조화 JSON + Markdown 섹션 | `aik_interpretations` |
| 용어 사전 export | JSON | `/docs/domain/glossary-seed.md`와 동기화 |
| 검수 이력 | DB row | `aik_audit_log` |
| Lighthouse 리포트 | HTML (CI 산출물) | Vercel 빌드 |

### 5.7 환경 변수

| 변수명 | 용도 |
|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 anon 키 (RLS로 보호) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 사이드 관리자 작업용 (Route Handler 한정) |
| `SUPABASE_EDGE_FUNCTION_URL` | Edge Function 호출 엔드포인트 (파이프라인 실행) |
| `ANTHROPIC_API_KEY` | Claude Sonnet 호출 |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` (고정값, 환경별 오버라이드용) |
| `CRAWLER_USER_AGENT` | 크롤링 시 User-Agent (예: `ActuarialIntelKR/1.0 (+https://...)`) |
| `LLM_DAILY_CALL_LIMIT` | 일일 LLM 호출 상한 (비용 방어). 도달 시 큐 적재·익일 재개 |
| `MEMBER_DOMAIN_WHITELIST` | 회원 자동 1차 분류용 이메일 도메인 콤마 구분 목록 |
| `DISCOVERY_DEFAULT_SCHEDULE` | 자동 정기 수집 기본 cron 표현 (예: `0 0 * * 1` — 매주 월요일 00:00 KST). 소스별 override는 `aik_sources.auto_crawl_schedule` |
| `DISCOVERY_MAX_NEW_PER_RUN` | 1회 실행에서 한 소스가 새로 등록 가능한 후보 상한 (폭주 방지, 기본 20) |
| `SUBMISSION_CONTACT_EMAIL` | about 페이지에 노출되는 자료 제안 이메일 주소 |
| `SUBMISSION_FORM_URL` | about 페이지에 노출되는 외부 자료 제안 양식 URL (예: Google Form) |
| `BACKUP_GITHUB_PAT` | GitHub Actions가 일일 CSV 덤프 push할 PAT (private repo) |
| `BACKUP_GITHUB_REPO` | 백업 대상 private repo (예: `tkleen/aik-backup`) |
| `NEXT_PUBLIC_SITE_URL` | 절대 URL·OG·sitemap 생성용 |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Vercel Analytics 토글 |

`RESEND_API_KEY`는 v1.1에서 제거됨 (운영 알림은 인앱, 트랜잭셔널은 Supabase Auth 기본).

---

## 6. 참고 자료

### 6.1 외부 데이터 소스
- SOA Mortality & Longevity Strategic Research: 해외 계리 연구 핵심 소스
- SOA Individual Life Mortality Experience Studies: 경험사망률 보고서
- KIRI (보험연구원): 한국 보험시장 구조·제도 해설
- KOSIS (국가통계포털): 인구·건강·복지·노동 등 공공 데이터
- 통계청 생명표: 연령별 사망확률·기대여명
- 한국보험계리사회 국제동향 자료: 번역 톤·용어 기준 참고

### 6.2 기술 문서 링크 (구현 시 `/docs/references/`에 보강)
- Next.js 15 App Router 공식 문서 (SSG, ISR, on-demand revalidate)
- Next.js ImageResponse (동적 OG 이미지)
- Supabase Auth + RLS 가이드
- Supabase Edge Functions (Deno 런타임, 백그라운드 작업)
- Supabase Realtime
- Anthropic Claude API (스트리밍, 비용 관리, 일 한도 처리)
- TweakCN (tweakcn.com) / shadcn/ui 컴포넌트 카탈로그
- Vercel Cron (스케줄링)
- Vercel Analytics
- KOSIS Open API 명세

### 6.3 디자인 레퍼런스
- Stripe Press (에디토리얼 타이포)
- Linear Insights (대시보드 데이터 위젯)
- Munich Re / Swiss Re Sigma 리포트 (보험 신뢰감)
- MIT Technology Review (연구 콘텐츠 레이아웃)

### 6.4 도메인 지식 문서 (구현 시 `/docs/domain/`에 작성)
- `glossary-seed.md` — 초기 영-한 계리 용어 100개 시드
- `adoption-grade-rubric.md` — 도입 등급 5축 점수 기준 + 초기 가중치 (데이터 0.30 / 규제 0.25 / 상품 0.20 / 난이도 0.15 / 효과 0.10) + 분기별 회고 양식
- `korea-data-catalog.md` — KOSIS·생명표·KIRI 링크 카탈로그 (시드 30~50개)
- `schema.md` — 20개 테이블 ERD (`aik_discovery_runs` 포함)
- `content-collection-policy.md` — 부록 C와 동기화. SOA Members-only 제외 규칙, 인용 경계, 인덱싱 정책
- `regulatory-disclaimer.md` — `aik_interpretations.regulatory_impact`에 자동 부착되는 면책 문구 표준 텍스트 + 버전 관리

---

## 부록 A. MVP 범위와 v2.0 이연

### MVP (v1.1) — 마일스톤 분할

**M1 — 공개 읽기 출시 (목표 4주)**
- 공개 페이지 8개 (랜딩, 라이브러리, 상세, 주제, 업무영역, 데이터카탈로그, 용어사전, 소개)
- 관리자 페이지 6개 (로그인, 대시보드, 소스, 문서, 검수, 용어사전)
- 반자동 파이프라인: URL 등록 → Supabase Edge Function → 단계별 검수 게이트 → 게시
- **4단계 처리 깊이(`depth_stage`) 도입**, 시드 자료는 `interpreted`까지 수동 승격
- 라이브러리 필터에 `region`·`depth_stage` 기본 노출 (track은 관리자 전용)
- 초기 소스 3개 (SOA Research 무료 공개, SOA Experience Studies 무료 공개, KIRI)
- 초기 시드 5건 published (SOA mortality 중심, `interpreted` 단계)
- 용어 사전 시드 100개
- 다크 모드 토글 (공개 페이지만), 한국어 UI
- TweakCN 토큰 적용, Noto Serif KR + Pretendard + JetBrains Mono
- SEO: 동적 OG 이미지, JSON-LD Article, sitemap.xml
- Vercel Analytics + `aik_event_log`
- about 페이지에 자료 제안 이메일·외부 양식 안내

**M2 — 자동 수집·국내 자료 트랙 확장 (M1 후 4주)**
- 시드 누적 15건 (SOA·재보험사·KIRI 등) 게시, 일부는 `summarized`·`translated` 단계로도 게시(전체 4단계 운영)
- **자동 정기 수집 도입(반자동)**: `aik_discovery_runs`, `discovery-scheduler` Edge Function, `/admin/discovery` 큐
- **국내 자료 큐레이션 트랙 본격 착수**: 보험연구원·금감원·학회·통계청 자료를 `region=domestic` + `track=korea_curated`로 등록
- 관리자 페이지에 discovery·피드백·알림 큐 추가
- 검수 UI 부분 재생성·LLM 스트리밍·단축키(N/A/R/G) + 깊이 승격 UI
- 일일 GitHub Actions CSV 백업 가동
- 인앱 알림 벨 (파이프라인 실패·LLM 한도·크롤링 차단·신규 발견 후보)

**M3 — 회원 가입 공개 + 자동 수집 정밀화 (M2 후 3주)**
- 회원 가입·로그인·승인 큐 (`/auth/*`, `/admin/members`)
- 회원 페이지 (`/account/bookmarks`, `/account/filters`, `/account/settings`)
- 번역 본문 전문이 로그인 회원에게 노출 (`depth_stage>='translated'` 자료)
- 피드백 폼 (`aik_feedback`)
- 도메인 화이트리스트 자동 분류
- **자동 수집 정밀화**: 소스별 셀렉터 튜닝, 캐치율 90% 목표
- 시드 누적 25~30건, 그중 `interpreted` 비중 ≥ 30%
- 회원 모집 안내 + about 페이지 콘텐츠 수집 정책 공식화

### v2.0 이연
- 정기 자동 크롤링 스케줄러 (반자동 → 완전 자동, 자동 게시 임계값 도입 검토)
- 이메일 구독 (관심 주제별 알림) — 도입 시 Resend 재검토
- 댓글·평점
- 다국어 UI (영문 병행)
- 벡터 검색 (pgvector 기반 의미 유사도)
- 추가 소스 (재보험사 보고서, 감독당국 자료, 학술논문)
- KOSIS API 직접 연동 (현재 MVP는 링크 카탈로그)
- Slack Webhook 알림 (다수 관리자 환경 진입 시)
- 모바일 관리자 검수 풀 지원

---

## 부록 B. 실패 처리 매핑 요약

| 시나리오 | 처리 방식 |
|---------|---------|
| 크롤링 HTTP 오류 (5xx) | 자동 재시도 3회 → 관리자 인앱 알림 (`crawler_blocked`) |
| 크롤링 403/차단 | 재시도 1회 후 즉시 인앱 알림 → 관리자가 수동 PDF 업로드 폴백, 폴백 시에도 SOA Members-only 자료는 거부 |
| robots.txt disallow 감지 | 등록 단계에서 자동 거부, 관리자에 사유 표시 |
| LLM 번역 출력 스키마 불일치 | 자동 재시도 2회 → 검수 큐에 raw 출력 첨부 |
| 용어 사전 일치율 < 90% | 검수 큐 우선순위 상향 (에스컬레이션 아님) |
| 한국형 해석 항목 누락 | 자동 재시도 1회 → 관리자 보완 폼 |
| 규제 면책 문구 누락 | 게시 차단(스키마 검증), 자동 부착 후 재검증 |
| LLM 일일 한도 도달 | `aik_processing_queue.status='pending_quota_reset'`, 익일 00:00 KST 자동 재개, 관리자 인앱 알림 |
| 회원 도메인 검증 실패 | `aik_members.status='pending'` + `domain_classification='other'`, 관리자 큐에 별도 표식 |
| 차트 렌더링 실패 | 폴백 UI: 표 형태로 데이터 표시 + 에러 로그 |
| 빌드 타입 오류 | 자동 재시도 3회 (수정) → 사람 검토 |
| Lighthouse < 90 | 사람 검토 (성능 저하 원인 분석) |
| ISR revalidate 실패 | 다음 revalidate 주기까지 stale 노출, 알림 |
| Members-only 자료 등록 시도 | 자동 거부 + 관리자에 사유 표시 |

---

## 부록 C. 콘텐츠 수집·인용·인덱싱 정책

### C.0 콘텐츠 소싱 3트랙 + 깊이 단계 매핑
- **트랙 1 — 저명 기관 자동 정기 수집(`auto_discovery`)**: M2 도입. `aik_sources.track='auto_discovery'`이며 `is_reputable=true`인 소스만 대상. Vercel Cron 주 1회 + 소스별 override 가능 (`auto_crawl_schedule`)
- **트랙 2 — 관리자 큐레이션(`admin_curated`)**: 관리자가 외부 학술 논문·기관 보고서·언론 등을 직접 URL 등록. 외부 사용자 제안은 **이메일(`SUBMISSION_CONTACT_EMAIL`) 또는 외부 양식(`SUBMISSION_FORM_URL`)** 수의로 접수 후 관리자가 평가해 등록 (이 때 `discovery_method='email_submission'` + `submitted_via_note`에 발신자·날짜 기록)
- **트랙 3 — 국내 자료 큐레이션(`korea_curated`)**: 국내 발행 자료(보험연구원·금감원·학회·통계청 등) 별도 수집. `region='domestic'`, 트랙은 별도로 관리하지만 자료 라이브러리에 통합 표시
- **시스템 UI 미신설**: 사용자가 직접 사이트에서 자료를 제안할 폼(`/submit` 등)은 신설하지 않음

### C.1 수집 범위 (게재 여부)
- **게재 대상**: 발행기관 사이트에서 비회원·비결제 상태로 즉시 다운로드 가능한 자료 (무료 공개 자료)
- **게재 제외**: SOA Members-only 페이지 뒤에 있는 자료, CCC 등 결제형 라이센스 자료, 학회·저널 페이월 자료
- **등록 단계 가드**: `aik_sources.members_only_default = true`인 소스 + URL이 `members-only` 패턴(예: `/research-restricted/`, `/login.aspx?return=`) 매칭 시 자동 거부
- **수동 검증**: 관리자가 URL 등록 시 "이 자료가 비회원에게도 공개되는가" 체크박스 강제

### C.1B "저명 기관(Reputable Source)" 기준 (자동 정기 수집 대상)
다음 3가지 신호 중 **최소 2가지를 충족**해야 `is_reputable=true`로 등록 가능:
- (i) **기관 성격**: 공식 학회·산업 협회·감독당국·국제기구·대형 재보험사·교수직 학자가 운영하는 리서치 그룹
- (ii) **지속성**: 5년 이상 정기 출판물(연 1회 이상) 보유
- (iii) **품질 신호**: 인용 빈도·동료평가·산업 표준 인용·정부 문서 인용 등 외부 검증 흔적

권장 초기 등록 후보:
- 해외: SOA, CAS, IFoA, Munich Re Research, Swiss Re Sigma, RGA Research, EIOPA, IAIS, NAIC
- 국내: KIRI(보험연구원), 한국보험계리사회, 금융감독원 발행물, 한국리스크관리학회, 한국보험학회, 통계청 보도자료

### C.2 인용 경계 (Quotation Policy)
- `aik_sources.quotation_policy` enum: `metadata_only`(SOA 등), `summary_with_quote`(KIRI·정부 자료), `public_full`(CC 라이센스·정부 공개)
- **공개 페이지(anon)**: 메타·요약·도입등급·한국형 해석(요약·적용·우선순위) + 50단어 이내 짧은 핵심 발췌 + "원본 보기 →" 외부 링크
- **회원 페이지(member)**: 번역 본문 전문(`depth_stage>='translated'`) + `regulatory_impact` 전체(`depth_stage='interpreted'`) + 자료별 외부 원본 URL 강조 노출
- **깊이 단계와 인용 경계의 관계**:
  - `registered`: 인용·발췌 금지, 메타데이터만 표시
  - `summarized`: 자체 작성 한국어 요약만 표시, 원문 직접 인용은 50단어 이내 1회로 제한
  - `translated`: 회원에 한해 본문 번역 전체 노출
  - `interpreted`: 회원에 한해 도입방안·규제 영향·필요 데이터 등 한국형 해석 추가 노출
- **자체 저장 금지**: 원본 PDF·HTML 사본은 Supabase Storage에 저장하지 않음. 파싱 결과의 텍스트만 DB에 저장
- **표·수치 재구성**: 표는 LLM 구조화로 재구성, 출처 명기. 수식은 이미지 캡처 + 캡션, 단순 수식만 KaTeX로 재현
- **명시적 출처**: 모든 자료 상세 페이지에 발행기관·라이센스·게재일·원본 URL 4종 메타 노출

### C.3 검색엔진 인덱싱 정책
| 페이지/리소스 | robots / meta |
|--------------|---------------|
| 랜딩, 라이브러리, 주제, 업무영역, 데이터 카탈로그, 소개, 자료 상세(메타·요약 영역) | `index, follow` + JSON-LD Article |
| 자료 상세의 번역 본문 전문 (`/library/[slug]` 내 회원 한정 영역) | 비회원 응답에서 해당 섹션 SSR 제외, `X-Robots-Tag: noindex` 헤더는 회원 응답에만 부여 |
| 용어 사전 페이지 | `noindex, follow` (대량 영문 정의가 콘텐츠 도용 위험) |
| `/auth/*`, `/account/*`, `/admin/*` | `noindex, nofollow` + 미들웨어 차단 |
| OG 이미지 (`/api/og/[slug]`) | `noindex` 헤더 |
| sitemap.xml | published 자료 메타·소개·랜딩만 포함, 회원·관리자 페이지 제외 |

### C.4 크롤러(자체 사이트가 외부를 크롤링할 때) 윤리
- User-Agent: `ActuarialIntelKR/1.0 (+https://<site>; contact:<email>)`
- robots.txt 사전 fetch + 검증 (`User-Agent: ActuarialIntelKR` 또는 `*` 기준)
- 도메인별 rate limit: 1 request/sec, burst 3
- 5xx는 지수 backoff 3회, 4xx(특히 403)는 1회 후 즉시 차단·관리자 알림 → 수동 PDF 업로드 폴백
- 동일 URL 24시간 이내 재크롤 금지
- **자동 정기 수집 추가 규칙**:
  - 소스별 `auto_crawl_schedule` 무시한 즉시 수집 금지 (수동 트리거는 `/admin/discovery/trigger`만 허용, 그것도 최소 1시간 간격)
  - `DISCOVERY_MAX_NEW_PER_RUN` 초과 시 초과분은 다음 실행으로 이연
  - `aik_discovery_runs`에 호출 횟수·신규 N건·실패 사유 모두 기록해 감사 가능
  - 셀렉터 변경으로 인한 false positive 발견 시 즉시 해당 후보 archived + 인앱 알림

### C.5 자료 라이프사이클 (수정판 처리)
- SOA가 Errata·수정판을 발행하면 새 `aik_documents` 행 INSERT (`parent_document_id` = 구버전 ID, 새 slug)
- 새 행 published 시 구버전 자동 `archived` 전환, 구버전 상세 페이지에 "이 자료는 수정판이 있습니다 → 새 버전 보기" 배너 표시
- 검색·라이브러리 기본 필터에서 archived 제외, 명시적 필터 토글로 조회 가능

---

## 부록 D. 운영 캐던스 및 거버넌스

### D.1 처리량 전제
- 관리자(tkleen) 주당 가용 시간: **10시간 이상**
- 시간 배분 가이드 (M3 안정화 후):
  - 4~5h: 신규 자료 5~8건 깊이 단계별 승격 + 검수 (단축키·부분 재생성 활용)
  - 1h: 자동 수집 큐(`/admin/discovery`) 후보 검토·승인·거절
  - 2h: 피드백·이의 처리
  - 1h: 회원 가입 신청 승인 큐
  - 1h: 용어 사전 보강 + 표준화
  - 1h: 분기 회고 준비 (가중치·정책 재점검·자동 수집 셀렉터 튜닝)
  - 여유분: 신규 소스 발굴, 국내 자료 큐레이션, 도입 등급 가중치 회고 자료 정리

### D.1B 깊이 단계별 1자료 처리 시간 가이드
| 단계 | 누적 시간 | 작업 |
|------|---------|------|
| `registered` | ≈ 10분 | URL 등록, 메타 추출 결과 검수, 트랙·region·목표 깊이 입력 |
| `summarized` | + 30분 | 자동 요약 검수·수정, 핵심 인사이트 한국어 작성 |
| `translated` | + 1.5h | 본문 번역 검수, 용어 일치율 90%+ 확인, 표·수식 후처리 |
| `interpreted` | + 2h | 한국 적용성·필요 데이터·규제 영향·도입 등급 작성, 면책 부착 확인 |

`interpreted`까지 도달하는 자료는 1자료당 누적 약 4시간 — 주당 1~2건이 현실적 상한. 나머지 자료는 `summarized` 또는 `translated`에서 멈춤.

### D.2 SLA
| 항목 | 목표 |
|------|------|
| URL 등록 → published | 영업일 7일 이내 |
| 회원 가입 신청 → 승인/거절 | 영업일 5일 이내 |
| 피드백 신고 → 1차 응답(in_review) | 영업일 3일 이내 |
| Errata 감지 → 수정판 published | 영업일 14일 이내 |
| Lighthouse 점수 | ≥ 90 (Performance, Accessibility, Best Practices, SEO) |

### D.3 도입 등급 가중치 거버넌스
- 초기 가중치는 설계자(tkleen)가 `docs/domain/adoption-grade-rubric.md`에 고정
- 매 분기 말 회고:
  1. 직전 3개월 published 자료의 5축 점수 분포 검토
  2. 회원·관리자 피드백 중 등급 이의 비율 분석
  3. **깊이 단계 분포 검토**: 어떤 트랙·region·주제의 자료가 `interpreted`까지 갔는지, 어디서 멈췄는지
  4. **자동 수집 캐치율 검토**: 소스별 발행 vs `aik_discovery_runs` 비교 → 셀렉터·스케줄 튜닝
  5. 가중치 ±0.05 단위 미세 조정, 변경 시 모든 active 자료에 대해 재계산 + 변경 로그 기록
- 가중치 변경은 면책 문구·검수 정책과 함께 about 페이지 변경 이력에 게시

### D.4 백업·복구 루틴
- Supabase Pro PITR: 7일 슬라이딩 윈도
- GitHub Actions(`backup.yml`) 매일 03:00 KST: `aik_documents`, `aik_translations`, `aik_interpretations`, `aik_glossary`, `aik_members`(이메일·이름만, 비밀번호 해시 제외)를 CSV로 export → `BACKUP_GITHUB_REPO` private repo에 커밋
- 복구 리허설: 분기 1회 staging 환경에 CSV 복원 + 무결성 점검

### D.5 비용·한도 모니터링
- 관리자 대시보드에 일일/월간 LLM 호출 카운터·예상 비용 위젯
- `LLM_DAILY_CALL_LIMIT` 도달 시 `aik_notifications.type='llm_quota_reached'` 발생, 그 시점 이후 신규 파이프라인 호출은 `aik_processing_queue.status='pending_quota_reset'`

---

## 부록 E. 자료 트랙·Region·깊이 매트릭스

본 매트릭스는 어떤 종류의 자료가 어느 트랙으로 들어오고, 어느 깊이까지 처리해야 하는지에 대한 큐레이션 가이드라인이다. 절대적 규칙이 아니라 운영 우선순위의 기본값으로 사용한다.

### E.1 트랙별 깊이 권장 기본값
| Track | Region | 일반적 자료 유형 | 권장 기본 `depth_stage` | 비고 |
|-------|--------|----------------|------------------------|------|
| `auto_discovery` | overseas | SOA·CAS·IFoA·재보험사 정기 리서치, 감독당국 보고서 | `summarized` 기본, 한국 영향 큰 자료만 `interpreted` 승격 | M2 도입, 대량 발견 자료에 1자료 4h 들이지 않도록 |
| `auto_discovery` | domestic | 통계청 보도자료·금감원 정기 보고 | `registered`~`summarized` | 통계는 데이터 카탈로그와 별도 |
| `admin_curated` | overseas | 학술 논문, 외부 추천 자료, 신생 기관 보고서 | `summarized` 기본, 도입 가치 인정 시 `interpreted` | 관리자가 직접 가치 판단 후 등록 |
| `admin_curated` | domestic | 한국 학술 논문, KIRI 단행본 외 | `summarized`~`translated` (한국어이므로 번역 단계는 영문 자료에만 해당; 국내 자료는 본문이 한국어인 경우 `summarized` 이후 바로 `interpreted` 승격 가능) | 본문 번역 단계는 영문 자료 한정 — 국내 자료는 본문이 이미 한국어이므로 스킵 |
| `email_submission` | overseas/domestic | 사용자 이메일·외부 양식으로 제안된 자료 | `registered`로 등록 후 가치 평가 → 가치 인정 시 `summarized`+ 승격 | 관리자가 평가 후 직접 등록, `submitted_via_note`에 출처 기록 |
| `korea_curated` | domestic | 보험연구원·금감원·학회·통계청 핵심 보고서 | 의사결정에 직결되는 자료는 `interpreted`까지 적극 | 국내 자료 트랙의 차별성: 도입방안이 아니라 **참조 가이드**로 변형 가능 |

### E.2 국내 자료(`region='domestic'`)의 깊이 의미 조정
국내 자료는 본문이 이미 한국어이므로 `translated` 단계 의미가 다음과 같이 조정된다:
- `registered`: 메타·요약 정도
- `summarized`: 핵심 인사이트의 한국어 재작성(원문 요약과 별도)
- `translated`: **(국내 자료는 미사용)** 또는 원문 영문 abstract가 있는 한국 학술논문에 한해 abstract 번역 정도
- `interpreted`: 한국 실무에서 어떻게 활용·확장·비교할 수 있는지 도입방안 제시 (해외 자료의 "한국 적용 가능성"과 대칭)

### E.3 큐레이션 우선순위 (어떤 자료를 먼저 `interpreted`까지 끌어올릴지)
관리자가 다음 점수표를 적용해 주간 우선순위를 결정:
- 한국 실무 적용 가능성 (0~3)
- K-ICS·IFRS17 등 규제 영향 강도 (0~3)
- 신선도 (발행 1년 내 +2, 1~3년 +1)
- 관련 국내 데이터·통계 매핑 가능성 (0~2)
- 사용자 피드백·요청 신호 (0~2, M3 회원 활성 후)

합계 8점 이상은 즉시 `interpreted` 후보, 5~7점은 `translated` 단계까지, 4점 이하는 `summarized`에서 멈춤.

### E.4 매트릭스 운영 회고
- 매 분기 회고 시 트랙×region×depth 분포 표를 출력
- 어떤 트랙이 처리 시간을 가장 많이 소비했는지, 어떤 트랙이 사용자 조회·책갈피·피드백을 가장 많이 받았는지 비교
- 회고 결과로 다음 분기의 권장 기본값을 조정 가능 (이력은 `docs/domain/adoption-grade-rubric.md`에 기록)
- 매월 1일 호출 통계·비용 자동 리포트 → 대시보드 위젯 (이메일 발송 X)


