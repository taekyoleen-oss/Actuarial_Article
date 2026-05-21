-- ====================================================================
-- seed.sql — M1 출시 시드 (소스 3 + 자료 3 + 용어 50)
-- 실행 순서: 0001~0005 마이그레이션 후
-- 적용: supabase db reset 또는 SQL Editor에서 직접 실행
-- ====================================================================

-- ----- 1. Sources ---------------------------------------------------
insert into aik_sources (id, name, base_url, organization, region, track, quotation_policy, members_only_default, robots_check_passed, is_reputable)
values
  ('11111111-1111-1111-1111-111111111111',
   'SOA Mortality & Longevity Research',
   'https://www.soa.org/resources/research-reports/research-topics/mortality-longevity/',
   'Society of Actuaries',
   'overseas', 'admin_curated', 'metadata_only', false, true, true),
  ('22222222-2222-2222-2222-222222222222',
   'SOA Individual Life Experience Studies',
   'https://www.soa.org/resources/experience-studies/',
   'Society of Actuaries',
   'overseas', 'admin_curated', 'metadata_only', false, true, true),
  ('33333333-3333-3333-3333-333333333333',
   'KIRI 보험연구원 정기간행물',
   'https://www.kiri.or.kr',
   '보험연구원',
   'domestic', 'korea_curated', 'summary_with_quote', false, true, true)
on conflict (id) do nothing;

-- ----- 2. Korea data sources ----------------------------------------
insert into aik_korea_data_sources (name, organization, url, description, data_type, update_frequency)
values
  ('국가통계포털 KOSIS', '통계청', 'https://kosis.kr',
   '인구·건강·복지·노동 등 광범위한 공공 데이터 포털', '통계', '월/분기/연 단위'),
  ('생명표', '통계청',
   'https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1B41',
   '연령별 사망확률·기대여명. 위험률 개발 기준 데이터', '생명표', '연간'),
  ('보험연구원 KIRI', '보험연구원', 'https://www.kiri.or.kr',
   '한국 보험시장 구조·제도 해설·연구 리포트', '리서치', '수시'),
  ('금융감독원 공시', '금융감독원', 'https://www.fss.or.kr',
   '보험·금융 감독 공시·통계·정책 자료', '감독·공시', '수시');

-- ----- 3. Glossary seed (50 terms across life/non-life/IFRS17/K-ICS) -
insert into aik_glossary (term_en, term_ko_standard, term_ko_alternatives, definition_ko, domain) values
  ('Mortality', '사망률', '{}', '일정 기간 일정 인구에서 발생한 사망의 비율', 'life'),
  ('Mortality Rate', '사망률', '{사망비}', '특정 기간 동안 특정 모집단에서의 사망 발생 비율', 'life'),
  ('Mortality Improvement', '사망률 개선', '{사망률 향상}', '시간 경과에 따른 사망률 감소 추세', 'life'),
  ('Mortality Table', '경험생명표', '{사망표}', '연령·성별 사망확률을 표 형태로 정리한 자료', 'life'),
  ('Life Expectancy', '기대여명', '{평균여명}', '특정 연령의 사람이 앞으로 살아갈 것으로 기대되는 평균 연수', 'life'),
  ('Longevity Risk', '장수위험', '{}', '피보험자의 기대여명이 가정을 초과하여 발생하는 손실 위험', 'life/annuity'),
  ('Annuity', '연금보험', '{}', '일정 기간 정기적으로 급여를 지급하는 보험', 'life'),
  ('Term Life Insurance', '정기보험', '{정기 생명보험}', '정해진 기간 내 사망 시 보험금을 지급하는 생명보험', 'life'),
  ('Whole Life Insurance', '종신보험', '{}', '피보험자가 사망할 때까지 보장하는 생명보험', 'life'),
  ('Endowment', '양로보험', '{}', '만기 시 생존 보험금 또는 사망 시 사망 보험금을 지급', 'life'),
  ('Persistency', '계약유지율', '{지속률}', '보험계약이 일정 기간 유지되는 비율', 'life'),
  ('Lapse', '해지', '{실효}', '보험계약자가 계약을 해지하는 행위', 'life'),
  ('Surrender Value', '해약환급금', '{}', '계약 해지 시 보험사가 계약자에게 지급하는 금액', 'life'),
  ('Reserve', '책임준비금', '{준비금}', '미래 보험금·환급금 등 부채를 위해 보험사가 적립하는 금액', 'accounting'),
  ('Best Estimate Liability', '최선추정부채', '{BEL}', 'IFRS 17·K-ICS에서 사용되는 편의 없는 최선 추정 부채', 'IFRS17/K-ICS'),
  ('Risk Adjustment', '위험조정', '{RA}', '비금융 위험에 대한 보상으로 측정에 반영하는 금액', 'IFRS17'),
  ('Contractual Service Margin', '보험계약마진', '{CSM}', '미래 이익을 부채로 인식해 보험계약 기간에 걸쳐 인식', 'IFRS17'),
  ('Loss Component', '손실요소', '{LC}', '보험계약 측정 시 손실이 예상되는 부분을 별도 인식', 'IFRS17'),
  ('Coverage Unit', '보장단위', '{}', 'CSM 상각의 기초가 되는 보장 제공 단위', 'IFRS17'),
  ('K-ICS', '한국 신지급여력제도', '{K아이씨에스}', 'IAIS ICS 기반 한국 보험사 자본규제 (Korean Insurance Capital Standard)', 'regulation'),
  ('Solvency II', '솔벤시 II', '{}', 'EU의 보험사 자본규제 체계', 'regulation'),
  ('Required Capital', '요구자본', '{RC}', '감독당국이 보험사에 요구하는 최소 자본', 'K-ICS'),
  ('Available Capital', '가용자본', '{AC}', '실제로 위험흡수가 가능한 자본', 'K-ICS'),
  ('Stress Test', '스트레스 테스트', '{}', '극단적 시나리오 하의 자본·손익 영향 평가', 'risk'),
  ('VaR', '위험가치', '{Value at Risk, VaR}', '주어진 신뢰수준에서 일정 기간 동안 발생 가능한 최대 손실 추정치', 'risk'),
  ('Predictive Analytics', '예측분석', '{}', '통계·머신러닝으로 미래 사건 발생 가능성을 예측', 'data'),
  ('Generalized Linear Model', '일반화 선형모형', '{GLM}', '반응변수의 분포 가정을 일반화한 선형회귀 확장', 'data'),
  ('Accelerated Underwriting', '가속언더라이팅', '{}', '데이터·예측모형 기반의 간소화 언더라이팅', 'underwriting'),
  ('Underwriting', '언더라이팅', '{UW}', '보험 청약 위험을 평가하고 인수 여부·조건을 결정하는 과정', 'underwriting'),
  ('Adverse Selection', '역선택', '{}', '보험사보다 위험에 대한 정보가 더 많은 가입자가 보험에 가입하는 경향', 'underwriting'),
  ('Moral Hazard', '도덕적 해이', '{}', '보험 가입 후 위험 회피 노력이 감소하는 현상', 'underwriting'),
  ('Pricing Adequacy', '요율 적정성', '{}', '보험료가 미래 손해와 비용을 적정하게 반영하는지의 평가', 'pricing'),
  ('Loss Ratio', '손해율', '{}', '발생손해액 ÷ 발생보험료', 'non-life'),
  ('Combined Ratio', '합산비율', '{}', '손해율 + 사업비율', 'non-life'),
  ('Expense Ratio', '사업비율', '{}', '사업비 ÷ 발생보험료', 'non-life'),
  ('IBNR', 'IBNR', '{미보고발생사고}', 'Incurred But Not Reported — 발생했으나 아직 보고되지 않은 손해', 'non-life'),
  ('Claim Frequency', '사고 빈도', '{}', '단위 노출당 사고 발생 건수', 'non-life'),
  ('Claim Severity', '사고 심도', '{사고 크기}', '사고 1건당 평균 손해액', 'non-life'),
  ('Reinsurance', '재보험', '{}', '보험사가 인수한 위험의 일부 또는 전부를 다른 보험사에 출재', 'reinsurance'),
  ('Cedant', '출재사', '{원수보험사}', '원수보험사가 재보험사에 위험을 출재할 때의 원수보험사', 'reinsurance'),
  ('Reinsurer', '재보험사', '{}', '출재사로부터 위험을 인수하는 보험사', 'reinsurance'),
  ('Quota Share', '비례재보험', '{Quota Share}', '원수 위험의 일정 비율을 재보험사에 출재하는 방식', 'reinsurance'),
  ('Excess of Loss', '초과손해액 재보험', '{XoL}', '일정 한도를 초과하는 손해만 재보험사가 부담', 'reinsurance'),
  ('Catastrophe Bond', '재해채권', '{CAT Bond}', '대형 재해 손실을 자본시장에 전가하는 채권', 'reinsurance'),
  ('Embedded Value', '내재가치', '{EV}', '보험사의 보유계약 가치와 조정순자산의 합', 'finance'),
  ('Value of New Business', '신계약가치', '{VNB}', '특정 기간 신계약이 창출한 현재가치', 'finance'),
  ('Discount Rate', '할인율', '{}', '미래 현금흐름을 현재가치로 환산할 때 사용하는 비율', 'finance'),
  ('Yield Curve', '수익률곡선', '{이자율 기간구조}', '만기별 이자율을 곡선으로 표현한 그래프', 'finance'),
  ('Duration', '듀레이션', '{}', '금리 변동에 대한 채권·부채 가치의 민감도 지표', 'finance'),
  ('Asset Liability Management', '자산부채관리', '{ALM}', '자산과 부채의 만기·금리·통화 구조를 일치시켜 위험을 관리', 'finance')
on conflict (term_en) do nothing;

-- ----- 4. Sample documents ------------------------------------------
-- Document 1: interpreted (full) — SOA mortality study with Korea interpretation
insert into aik_documents (
  id, source_id, original_url, title, title_ko, original_lang,
  published_at, fetched_at, status, depth_stage, target_depth_stage,
  region, track, discovery_method, slug, primary_topic, business_areas,
  adoption_grade, adoption_axes, is_members_only_source
) values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'https://www.soa.org/sample-mortality-study-2025/',
  '2025 Individual Life Insurance Mortality Improvement Update',
  '2025년 개인생명보험 사망률 개선 업데이트',
  'en',
  '2025-09-15',
  now(),
  'published',
  'interpreted',
  'interpreted',
  'overseas',
  'admin_curated',
  'admin_manual',
  '2025-mortality-improvement-update-aik',
  'mortality_improvement',
  ARRAY['risk_rate', 'product_development']::aik_business_area[],
  'pilot',
  '{"data": 4, "regulation": 3, "product": 4, "difficulty": 3, "effect": 4}'::jsonb,
  false
) on conflict (id) do nothing;

insert into aik_translations (document_id, version, content_md, glossary_match_rate, created_by, llm_model_used)
values (
  '44444444-4444-4444-4444-444444444444',
  1,
  '## 핵심 결론\n\n2010~2024년 SOA 표준 풀(Standard Pool) 데이터 분석 결과, 사망률 개선(Mortality Improvement, MI) 추세는 **연령대별·성별로 큰 편차**를 보였습니다. 35~64세 남성에서는 연 평균 1.8% 개선, 65세 이상에서는 0.9%로 둔화되었습니다.\n\n## 방법론\n\n표준 풀 자료에서 보험기간 5년 이상·금액가중 사망률을 기반으로 Lee-Carter 모형과 Cairns-Blake-Dowd 모형을 비교 적용했습니다. COVID-19 충격은 별도 더미변수로 처리했습니다.\n\n## 주요 발견\n\n1. 사망률 개선 추세 **둔화**: 2010년대 초반 대비 2020년대 평균 MI율 약 0.4%p 하락\n2. 연령·성별 이질성 확대: 50대 여성의 MI율이 가장 높음\n3. COVID-19 영향: 2020-2021 일시적 역행 후 2022년부터 회귀 추세\n\n## 시사점\n\n향후 가격 책정 및 책임준비금 산출 시 단일 MI 가정 적용을 재검토할 필요가 있습니다.',
  0.93,
  'llm',
  'claude-sonnet-4-6'
) on conflict (document_id, version) do nothing;

insert into aik_interpretations (
  document_id, summary_ko, korea_applicability, required_korea_data,
  regulatory_impact, target_departments, adoption_difficulty, adoption_notes
) values (
  '44444444-4444-4444-4444-444444444444',
  '2025년 SOA 사망률 개선 업데이트는 연령·성별 이질성 확대와 개선 둔화 추세를 보입니다. 한국 보험사도 단일 MI 가정 적용을 재검토하고, 연령·성별 세분화한 MI 가정으로 전환을 고려할 시점입니다.',
  '한국에서도 통계청 생명표 기반 사망률 개선 추세가 SOA 데이터와 유사하게 관찰됩니다. 연령·성별 세분화 MI 가정 적용 시 (i) 50대 이상 사망보험 책임준비금이 다소 증가하고, (ii) 종신연금 BEL이 0.5~1.5% 증가할 수 있습니다. 위험률 개발팀과 상품개발팀이 함께 검토 권장.',
  '필수 데이터: 통계청 생명표(연도별·연령별·성별), 국민건강보험공단 사망 통계, 자사 경험사망률 5년 이상. KOSIS 표 DT_1B41은 무료 접근 가능. 자사 경험률은 회사 보유.',
  'K-ICS 위험계수 측정 시 사망률 개선 가정이 반영되며, 본 자료의 권고를 적용하면 보험위험 자본의 1~3% 변동이 예상됩니다. IFRS 17 측정에서도 최선추정 사망률 가정 갱신이 필요합니다.\n\n※ 참고용이며 실제 적용은 소속 회사·감독원 해석을 따릅니다.',
  ARRAY['risk_rate', 'product_development', 'ifrs17']::aik_business_area[],
  '시스템 측면: 위험률 산출 모듈 수정 (난이도 중). 데이터 측면: 자사 경험률 재집계 필요 (난이도 중). 업무 측면: 가정 변경 절차 + 감독 신고 (난이도 상).',
  '권장 도입 절차: (1) 자사 경험률 재집계 → (2) 통계청 생명표와 비교 분석 → (3) MI 가정 시안 작성 → (4) 가정 위원회 승인 → (5) 시스템 적용·재무 영향 시뮬레이션. 6~12개월 일정 권장.'
) on conflict (document_id) do nothing;

-- Document 2: translated (no Korea interpretation yet)
insert into aik_documents (
  id, source_id, original_url, title, title_ko, original_lang,
  published_at, fetched_at, status, depth_stage, target_depth_stage,
  region, track, discovery_method, slug, primary_topic, business_areas,
  is_members_only_source
) values (
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  'https://www.soa.org/sample-experience-study/',
  'Group Term Life Persistency Experience 2024',
  '2024년 단체정기보험 계약유지율 경험분석',
  'en',
  '2024-12-01',
  now(),
  'published',
  'translated',
  'translated',
  'overseas',
  'admin_curated',
  'admin_manual',
  'group-term-life-persistency-2024-aik',
  'persistency',
  ARRAY['product_development', 'risk_rate']::aik_business_area[],
  false
) on conflict (id) do nothing;

insert into aik_translations (document_id, version, content_md, glossary_match_rate, created_by, llm_model_used)
values (
  '55555555-5555-5555-5555-555555555555',
  1,
  '## 개요\n\n2018~2023년 미국 단체정기보험 계약유지율(Persistency) 경험을 분석합니다. 표본 가입자 약 1,200만 명, 보험기간 5년 이내 단체계약을 대상으로 합니다.\n\n## 핵심 결과\n\n- 1차년도 계약유지율: 82% (산업 평균 대비 +2%p)\n- 5차년도 계약유지율: 51%\n- 보험금액 대 구간별 차이가 두드러짐: 고액(USD 500K 이상) 유지율이 평균 대비 8%p 높음\n\n## 영향 요인\n\n1. 사업장 규모: 종업원 500인 이상 사업장에서 유지율 안정\n2. 보험금액 구간: 고액일수록 안정적\n3. 산업별 차이: 금융·IT 산업이 가장 높음\n\n## 시사점\n\n단체정기보험의 보험료 산출 시 (i) 사업장 규모, (ii) 보험금액 구간, (iii) 산업 구분을 모형 변수로 포함하면 손해율 예측 정확도가 개선될 가능성이 있습니다.',
  0.91,
  'llm',
  'claude-sonnet-4-6'
) on conflict (document_id, version) do nothing;

-- Document 3: summarized only
insert into aik_documents (
  id, source_id, original_url, title, title_ko, original_lang,
  published_at, fetched_at, status, depth_stage, target_depth_stage,
  region, track, discovery_method, slug, primary_topic, business_areas,
  is_members_only_source
) values (
  '66666666-6666-6666-6666-666666666666',
  '33333333-3333-3333-3333-333333333333',
  'https://www.kiri.or.kr/sample-report-2025/',
  '국내 보험사 IFRS 17 적용 1년 차 경험과 시사점',
  '국내 보험사 IFRS 17 적용 1년 차 경험과 시사점',
  'ko',
  '2025-06-30',
  now(),
  'published',
  'summarized',
  'translated',
  'domestic',
  'korea_curated',
  'korea_seed',
  'kiri-ifrs17-year1-experience-aik',
  'ifrs17',
  ARRAY['ifrs17', 'management_planning']::aik_business_area[],
  false
) on conflict (id) do nothing;

insert into aik_interpretations (document_id, summary_ko)
values (
  '66666666-6666-6666-6666-666666666666',
  'IFRS 17 적용 첫 해 국내 손해보험·생명보험사의 회계 처리·시스템 운영 경험을 분석. CSM 상각 모형, 위험조정 산출 방식, 보험금융수익·비용 분리 회계 처리 등 주요 쟁점별 회사 간 차이가 두드러집니다. 향후 2~3년 동안 가정·방법론 수렴이 예상되며, 감독당국의 추가 가이드라인이 발표될 가능성이 큽니다.'
) on conflict (document_id) do nothing;

-- ----- 5. Document tags (free tags will be filled in later) -----------
insert into aik_tags (name, approved) values
  ('lee-carter', true),
  ('cbd-model', true),
  ('experience-study', true),
  ('csm-amortization', true)
on conflict (name) do nothing;

-- ----- 6. KR data mapping (sample) -----------------------------------
insert into aik_document_korea_data (document_id, korea_data_id, llm_confidence, reviewed)
select
  '44444444-4444-4444-4444-444444444444',
  k.id,
  0.92,
  true
from aik_korea_data_sources k
where k.name in ('생명표', '국가통계포털 KOSIS')
on conflict do nothing;
