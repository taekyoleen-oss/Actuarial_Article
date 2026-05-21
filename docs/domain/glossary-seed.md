# Glossary Seed (v0.1)

설계서 §6.4 기준, 초기 100개 시드를 향한 시작점 (현재 20개).
DB 적재는 별도 `supabase/seed.sql` (M1 시드 자료와 함께)로 일괄 처리.

| 영어 | 한국어 표준 | 영역 | 정의 (한 줄) |
|------|------------|------|------------|
| Mortality | 사망률 | life | 일정 기간 일정 인구에서 발생한 사망의 비율 |
| Mortality Improvement | 사망률 개선 | life | 시간 경과에 따른 사망률 감소 추세 |
| Longevity Risk | 장수위험 | life/annuity | 기대여명이 가정을 초과하여 발생하는 손실 위험 |
| Best Estimate | 최선추정 | IFRS17/K-ICS | 편의 없이 추정한 가정값. 측정·재측정의 출발점 |
| K-ICS | 한국 신지급여력제도 | regulation | Korean Insurance Capital Standard, IAIS ICS 기반 자본규제 |
| IFRS 17 | 국제회계기준 17호 | accounting | 보험계약 측정·인식·표시 기준 |
| Accelerated Underwriting | 가속언더라이팅 | underwriting | 데이터·예측모형 기반의 간소화 언더라이팅 |
| Persistency | 계약유지율 | non-life/life | 보험계약이 일정 기간 유지되는 비율 |
| Predictive Analytics | 예측분석 | data | 통계·머신러닝으로 미래 사건 발생 가능성을 예측 |
| Reserve | 책임준비금 | accounting | 미래 보험금·환급금 등 부채를 위해 적립한 금액 |
| Risk Adjustment | 위험조정 | IFRS17 | 비금융 위험에 대한 보상으로 측정에 반영하는 금액 |
| Contractual Service Margin | 보험계약마진 | IFRS17 | 미래 이익을 부채로 인식해 계약기간에 걸쳐 인식 |
| Solvency II | 솔벤시 II | regulation | EU의 보험사 자본규제 체계 |
| Cedant | 출재사 | reinsurance | 원수보험사가 재보험사에 위험을 출재할 때의 원수보험사 |
| Reinsurer | 재보험사 | reinsurance | 출재사로부터 위험을 인수하는 보험사 |
| Loss Ratio | 손해율 | non-life | 발생손해액 ÷ 발생보험료 |
| Combined Ratio | 합산비율 | non-life | 손해율 + 사업비율 |
| Lapse | 해지 | life | 보험계약자가 계약을 해지하는 행위 |
| Annuity | 연금보험 | life | 일정 기간 정기적으로 급여를 지급하는 보험 |
| Term Life | 정기보험 | life | 정해진 기간 사망 시 보험금을 지급하는 생명보험 |

확장 계획: M1 출시 전 100개 시드 도달, M3 안정화 후 200개+ 운영.
