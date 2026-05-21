# 데이터 스키마 ERD (v1.2 — 20 tables)

설계서 §3 매핑. 실제 정의는 `supabase/migrations/` SQL 참조.

## 핵심 관계
```
                                  ┌───────────────┐
                                  │  aik_sources  │  (region, track, quotation_policy)
                                  └───────┬───────┘
                                          │1                          ┌─────────────────────┐
                                          ├──< aik_discovery_runs ───<│ (Cron 실행 기록)    │
                                          │                           └─────────────────────┘
                                          │1
                                          ↓N
                                  ┌────────────────┐
                                  │ aik_documents  │   (depth_stage, region, track, ...)
                                  │   └ parent_document_id (self FK — 수정판 체인)
                                  └─┬──────┬───────┘
                       1│           │1     │N
                        ↓N          ↓1     ↓N
                ┌──────────┐  ┌──────────────────┐  ┌───────────────────────┐
                │ aik_     │  │ aik_             │  │ aik_document_tags     │
                │ trans-   │  │ interpretations  │  │   >─ aik_tags         │
                │ lations  │  │   (1자료 1개)    │  └───────────────────────┘
                └────┬─────┘  └──────────────────┘
                     │ (문장 hit)
                     ↓
              ┌────────────────────────┐
              │ aik_translation_cache  │ (TM Lite)
              └────────────────────────┘

aik_documents ─< aik_document_korea_data >─ aik_korea_data_sources
aik_documents ─< aik_processing_queue (이력)
aik_documents ─< aik_bookmarks >─ aik_members
aik_documents ─< aik_feedback  >─ aik_members
aik_members   ─< aik_saved_filters

(독립 테이블)
aik_glossary, aik_admin_users, aik_audit_log, aik_event_log, aik_notifications
```

## 권한 모델
- anon: `aik_public_documents` view + `aik_public_interpretation_summary` view + glossary + tags(approved) + korea_data_sources
- member: 위 + `aik_translations.content_md`(depth ≥ translated) + 본인의 bookmarks/saved_filters/feedback
- admin: 전체 read/write + `aik_admin_users` 등록 필수

## 마이그레이션 순서
1. `0001_enums.sql` — 13 enum, pg_trgm/uuid-ossp 확장
2. `0002_tables_core.sql` — sources, documents, translations, translation_cache, interpretations, discovery_runs
3. `0003_tables_members_misc.sql` — 회원·태그·용어·국내데이터·큐·피드백·이벤트·관리자·감사·알림
4. `0004_helpers.sql` — `aik_is_admin()`, `aik_is_active_member()`, audit/touch 트리거
5. `0005_rls.sql` — 3-tier RLS + public views

## 핵심 인덱스
- `aik_documents`: status, (region, depth_stage), published_at desc, primary_topic, business_areas GIN, source_id, track, title/title_ko trigram GIN
- `aik_glossary`: term_en/term_ko_standard trigram GIN
- `aik_translation_cache`: sentence_hash unique
- `aik_discovery_runs`: (source_id, started_at desc)
- `aik_notifications`: 미읽음 부분 인덱스

## 파괴적 변경 시 절차
1. 마이그레이션 새 파일 (`0006_*.sql`)로 추가
2. RLS 영향 시 `0005_rls.sql` 수정 금지 → 새 파일에서 `drop policy`/`create policy`
3. `types/domain.ts`와 DB enum 동기화 확인
4. `npm run types:supabase`로 `types/database.ts` 재생성
