# CLAUDE.md — 작업 가이드

본 파일은 Claude Code가 이 저장소에서 작업할 때 참조하는 운영 가이드다.

## 1. 프로젝트 한 줄
**Actuarial Intel Korea** — 해외·국내 보험·계리 자료를 한국 실무 도입 관점으로 큐레이션하는 Next.js 15 + Supabase + Claude Sonnet 4.6 플랫폼. 상세 설계는 `actuarial_intel_platform_design.md` (v1.2).

## 2. 디렉토리 맵
- `app/(public)/` — anon 접근, 공개 페이지 (랜딩·라이브러리·상세·주제·업무영역·데이터·용어·소개·`auth/*`)
- `app/(member)/account/*` — 회원 전용 (책갈피·저장 필터·계정)
- `app/(admin)/admin/*` — 관리자 전용 (라이트 고정, `aik_admin_users` 확인 후 접근)
- `app/api/{public,member,admin}/*` — Route Handlers
- `components/{ui,shared,document,library,admin}/`
- `lib/supabase/{client,server,middleware}.ts` + `queries/`
- `lib/anthropic/{client,schemas}.ts` + `prompts/` (다음 세션)
- `lib/pipeline/` — 오케스트레이터·단계별 로직 (다음 세션)
- `supabase/migrations/0001~0005.sql` — 마이그레이션
- `supabase/functions/` — Edge Functions
- `types/{domain,database}.ts` — enum·타입 단일 진실

## 3. 핵심 도메인 용어 (자세한 것은 설계서 §1.6)
- **depth_stage**: `registered` → `summarized` → `translated` → `interpreted` — 자료 처리 깊이 4단계
- **region**: `overseas` / `domestic`
- **track**: `auto_discovery` / `admin_curated` / `email_submission` / `korea_curated`
- **adoption_grade**: `immediate` / `pilot` / `internal_research` / `monitoring`
- **3-tier 권한**: anon / member / admin
- 자세한 enum은 `types/domain.ts`에 단일 정의됨 — **DB enum과 1:1 매칭** 유지 필수

## 4. 라우트 그룹 규칙
- `(public)` — 누구나, 다크 모드 지원
- `(member)` — `aik_members.status='active'` 보유자만, 미들웨어가 `/auth/login` 리다이렉트
- `(admin)` — `aik_admin_users` 등록자만, 미들웨어가 `/admin/login` 리다이렉트, 라이트 모드 고정
- `api/admin/*` — 서비스 키 또는 관리자 세션 검증
- `api/public/event` — 익명 분석 이벤트 기록(서비스 키 경유)

## 5. 데이터 흐름 (요약)
1. 관리자가 URL 등록 → `aik_documents` `pending` 상태로 INSERT
2. Vercel Cron 또는 수동 트리거 → Supabase Edge Function 백그라운드 실행
3. 단계별 LLM 호출 (요약 → 번역 → 해석) + 용어 사전 후처리 + 캐시 hit 처리
4. 각 단계 완료 후 `review_pending`, 관리자 검수 → 승격 또는 보류
5. `published` 진입 시 ISR `revalidateTag` 호출 → 공개 페이지 갱신

자세한 흐름은 설계서 §2.2 참조.

## 6. 서브에이전트 호출 규칙
- 메인 에이전트가 오케스트레이터. 서브에이전트 간 직접 호출 금지
- 중간 산출물은 `/output/`에 JSON (git 제외)
- 4종 서브에이전트: `ui-builder`, `db-architect`, `api-designer`, `content-pipeline`

## 7. LLM 호출 정책
- 모델: `claude-sonnet-4-6` (환경변수 `ANTHROPIC_MODEL`)
- temperature 기본 0.2, 결정적 출력 우선
- 일일 한도: `LLM_DAILY_CALL_LIMIT` 도달 시 `aik_processing_queue.status='pending_quota_reset'`
- 모든 LLM 출력은 `lib/anthropic/schemas.ts`의 Zod 스키마로 파싱
- Prompt cache: 용어 사전·시스템 프롬프트 등 정적 컨텍스트는 cache header 적용 (claude-api skill 참조)
- 부분 재생성·스트리밍은 검수 페이지에서 활용

## 8. 검증·실패 처리 게이트
- 크롤링 403/차단 → 관리자 인앱 알림 → 수동 PDF 업로드 폴백 (단, Members-only는 거부)
- LLM 출력 스키마 불일치 → 자동 재시도 후 raw 출력 첨부해 검수 큐 적재
- 용어 일치율 < 90% → 검수 큐 우선순위 ↑
- 면책 문구 누락 → 게시 차단
- 자세한 매트릭스는 설계서 부록 B 참조

## 9. 작업 시작 전 체크리스트
- [ ] `types/domain.ts`와 마이그레이션 SQL의 enum 1:1 매칭 확인
- [ ] `.env.local`에 Supabase·Anthropic 키 설정
- [ ] `npm run typecheck` 통과
- [ ] RLS 정책이 의도한 권한 모델대로 동작하는지 검증
- [ ] 새 컴포넌트는 TweakCN 토큰만 사용 (`var(--color-*)`)

## 10. 코딩 컨벤션
- TypeScript strict, `async/await`, 명시적 readonly
- 서버 코드는 `import "server-only"` 강제 (lib/supabase/queries/*, lib/anthropic/*)
- 클라이언트 컴포넌트는 `"use client"` 첫 줄 명시
- 컬러는 `var(--color-*)` 토큰만 사용, 임의 hex 금지
- 한국어 UI 기본, 영문 메타 병기

## 11. 콘텐츠 수집·게재 제약 (절대 위반 금지)
- SOA Members-only / 결제형 라이센스 자료는 게재 X
- PDF는 자체 저장 X, 원본 URL만 보존
- 자료 제안은 별도 시스템 UI 신설 X — 이메일·외부 양식만
- 모든 LLM 산출물은 관리자 검수 게이트 통과 후 게시

## 12. 사용자 메모리
사용자 환경 메모리는 `~/.claude/projects/C--00-App-Project-Actuarial-Article-Platform/memory/`에 저장된다. 프로젝트 내에는 별도 사용자 메모리를 두지 않는다.
