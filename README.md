# Actuarial Intel Korea

해외·국내 보험·계리 자료를 한국 실무 도입 관점으로 큐레이션하는 플랫폼.
설계는 [`actuarial_intel_platform_design.md`](./actuarial_intel_platform_design.md) v1.2 참조.

## 기술 스택
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (`@theme` 디렉티브 기반 토큰)
- TweakCN(shadcn/ui) 컴포넌트 — 일부는 직접 작성
- Supabase (PostgreSQL + RLS + Auth + Edge Functions)
- Anthropic Claude Sonnet 4.6
- Vercel (배포·Cron·Analytics)

## 현재 구현 상태 (Phase 1a + 1b 완료 — M1 코드 베이스 95%)

**Phase 1a — Foundation**
✅ 프로젝트 부트스트랩, 폴더 구조, 도메인 enum·타입
✅ Supabase 마이그레이션 SQL 0001~0005 (20테이블·enum·RLS·helpers·public views)
✅ Supabase 클라이언트, Anthropic 클라이언트 + Zod 스키마
✅ 디자인 토큰, 공개 레이아웃, Header/Footer/ThemeToggle
✅ 공개 페이지 9개 + 컴포넌트 (DepthBadge, RegionPill, AdoptionBadge, DocumentCard)

**Phase 1b — Admin & LLM Pipeline**
✅ 관리자 인증·로그인·로그아웃 (`requireAdmin()`, `/admin/login`)
✅ 보호 레이아웃 + 사이드바 + 인앱 알림 배지
✅ 대시보드 (게시·검수·큐·미읽음 + 깊이 분포 + 최근 문서)
✅ 소스 관리 CRUD (region·track·인용정책·cron·members-only 가드)
✅ 문서 관리 (URL 등록 → 검수 페이지 자동 진입)
✅ 검수 워크스페이스: 깊이 승격 / 본문 오버라이드 / 번역·해석 인라인 편집 / 게시·아카이브
✅ 용어 사전 CRUD
✅ LLM 프롬프트: 번역·요약·해석 (시스템 스타일 가이드 + Zod 검증)
✅ 파이프라인 오케스트레이터: 4단계 게이트 + LLM 일일 한도 + 면책 자동 부착 + Members-only 자동 거부
✅ 익명 이벤트 endpoint (`/api/public/event`, rate-limit 포함)
✅ 동적 OG 이미지, sitemap.xml, robots.txt
✅ 35 routes Next.js production build 성공

**Phase 1c — M1 코드 베이스 100% 완료 (2026-05-21)**
✅ 시드 SQL (`supabase/seed.sql`): 소스 3 + 자료 3(interpreted/translated/summarized 각 1) + 용어 50 + 국내 데이터 4
✅ JSON-LD Article 구조화 데이터 (자료 상세 페이지)
✅ 부분 재생성 SSE 스트리밍 (`/api/admin/translate/regenerate`)
✅ 검수 단축키 N/A/R/G + ⌘K 글로벌 검색 팔레트(자료/주제/용어/명령 4구역)
✅ GitHub Actions 일일 CSV 백업 (`.github/workflows/backup.yml`)
✅ Lighthouse 폴리시: Pretendard preconnect/preload + Suspense skeleton (라이브러리·자료 상세)
✅ 37 routes production build 성공

**Phase 2 — M2 자동 정기 수집 완료 (2026-05-21)**
✅ `lib/pipeline/discovery.ts` — RSS/Atom 자동 감지 + HTML 셀렉터 폴백 + 중복 차단
✅ `/api/admin/discovery/trigger` — Vercel Cron 또는 관리자 수동 호출 (`CRON_SECRET` 인증)
✅ `/admin/discovery` 큐 실 동작 — 후보 자료 승인/거절 + 실행 이력
✅ `vercel.json` 주 1회 cron 스케줄 (월요일 03:00 KST)

## 다음 단계

**Phase 3 — M3**
🔜 `/auth/{login,signup,pending}` stub → 실 폼 교체
🔜 `/admin/members` 승인 큐 실 동작
🔜 `/account/{bookmarks,filters,settings}` 회원 페이지
🔜 회원 본문 노출 (`depth_stage>='translated'`)
🔜 피드백 폼 + `/admin/feedback` 처리

## M1 출시 운영 절차
1. Supabase 프로젝트 신설 → `supabase link --project-ref <ref>`
2. 마이그레이션 적용: `supabase db push` (0001~0005)
3. 시드 적용: `supabase db query --file supabase/seed.sql` 또는 SQL Editor에서 직접 실행
4. `.env.local`에 키 입력 (`.env.example` 참조)
5. Vercel 배포 + 도메인 연결
6. Supabase 콘솔에서 관리자 계정 생성 → `insert into aik_admin_users (auth_user_id) values ('<uid>');`
7. GitHub backup repo 생성 + Secrets 등록 (`SUPABASE_DB_URL`, `BACKUP_REPO_PAT`, `BACKUP_REPO_NAME`)
8. 실제 자료 추가 — `/admin/documents`에서 URL 등록 후 검수 페이지에서 깊이 승격

## 개발 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 편집 (Supabase URL/Key, Anthropic 키 등)

# 3. Supabase 프로젝트 준비
#   (a) supabase.com에서 새 프로젝트 생성
#   (b) supabase login
#   (c) supabase link --project-ref <your-ref>
#   (d) supabase db push       # supabase/migrations/* 적용
#   (e) npm run types:supabase # types/database.ts 생성

# 4. 개발 서버
npm run dev
# http://localhost:3000
```

## Supabase 마이그레이션

`supabase/migrations/` 디렉토리에 SQL 파일이 순서대로 있다. **반드시 순서대로 적용**:

| 파일 | 내용 |
|------|------|
| `0001_enums.sql` | 13개 도메인 enum + `uuid-ossp`, `pg_trgm` 확장 |
| `0002_tables_core.sql` | sources, documents, translations, translation_cache, interpretations, discovery_runs |
| `0003_tables_members_misc.sql` | glossary, tags, korea_data, queue, members, bookmarks, saved_filters, feedback, event_log, admin_users, audit_log, notifications |
| `0004_helpers.sql` | `aik_is_admin()`, `aik_is_active_member()`, audit triggers, touch_updated_at |
| `0005_rls.sql` | 3-tier RLS 정책 + public views (`aik_public_documents`, `aik_public_interpretation_summary`) |

## 폴더 구조 (요약, 자세한 것은 설계서 §5.1)

```
app/
  (public)/   # 공개 페이지 — anon 접근
  (member)/   # /account/* — 회원 전용
  (admin)/    # /admin/* — 관리자 전용 (라이트 모드 고정)
  api/        # public/member/admin 엔드포인트
components/
  ui/         # 직접 작성한 shadcn 스타일 컴포넌트
  shared/     # Header, Footer, DepthBadge, RegionPill, AdoptionBadge, ThemeToggle
  library/    # DocumentCard 등 라이브러리 전용
lib/
  supabase/   # client/server/middleware + queries/
  anthropic/  # client + schemas + (prompts/ 다음 세션)
  utils.ts
supabase/
  migrations/ # 0001~0005 SQL
  functions/  # Edge Functions (다음 세션 구현)
types/
  domain.ts   # enum·타입 단일 진실 (DB enum과 1:1)
  database.ts # supabase gen types 결과 (현재는 placeholder)
docs/
  references/ # 외부 시스템 참고 자료
  domain/     # 도메인 지식 (glossary-seed, adoption rubric 등)
```

## 콘텐츠 수집 정책 (핵심)
- **무료 공개 자료만** — SOA Members-only 등은 게재 X
- 자료 제안은 별도 시스템 UI 없이 이메일·외부 양식 수의
- 자동 정기 수집은 M2부터 도입 예정
- 자세한 정책은 설계서 부록 C 참조

## 라이센스
프로젝트 사정에 맞추어 추후 결정.
