// Domain enums and types per design §1.6 and §3.3.
// Single source of truth — DB enums must match these strings exactly.

export const REGIONS = ["overseas", "domestic"] as const;
export type Region = (typeof REGIONS)[number];

export const TRACKS = [
  "auto_discovery",
  "admin_curated",
  "email_submission",
  "korea_curated",
] as const;
export type Track = (typeof TRACKS)[number];

export const DISCOVERY_METHODS = [
  "auto",
  "admin_manual",
  "email_submission",
  "korea_seed",
] as const;
export type DiscoveryMethod = (typeof DISCOVERY_METHODS)[number];

export const DEPTH_STAGES = [
  "registered",
  "summarized",
  "translated",
  "interpreted",
] as const;
export type DepthStage = (typeof DEPTH_STAGES)[number];

export const ADOPTION_GRADES = [
  "immediate",
  "pilot",
  "internal_research",
  "monitoring",
] as const;
export type AdoptionGrade = (typeof ADOPTION_GRADES)[number];

export const DOCUMENT_STATUSES = [
  "pending",
  "processing",
  "pending_quota_reset",
  "review_pending",
  "published",
  "archived",
  "rejected",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const QUOTATION_POLICIES = [
  "metadata_only",
  "summary_with_quote",
  "public_full",
] as const;
export type QuotationPolicy = (typeof QUOTATION_POLICIES)[number];

export const MEMBER_STATUSES = [
  "pending",
  "active",
  "rejected",
  "suspended",
] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const DOMAIN_CLASSIFICATIONS = ["whitelist", "other", "blocked"] as const;
export type DomainClassification = (typeof DOMAIN_CLASSIFICATIONS)[number];

export const PRIMARY_TOPICS = [
  "mortality",
  "longevity",
  "mortality_improvement",
  "underwriting",
  "predictive_analytics",
  "ifrs17",
  "k_ics",
  "reinsurance",
  "persistency",
  "claims",
  "investment",
  "other",
] as const;
export type PrimaryTopic = (typeof PRIMARY_TOPICS)[number];

export const BUSINESS_AREAS = [
  "product_development",
  "risk_rate",
  "underwriting",
  "ifrs17",
  "k_ics",
  "reinsurance",
  "management_planning",
] as const;
export type BusinessArea = (typeof BUSINESS_AREAS)[number];

// === Display labels (Korean) ===
export const DEPTH_STAGE_LABELS: Record<DepthStage, string> = {
  registered: "메타",
  summarized: "요약",
  translated: "번역",
  interpreted: "해석",
};

export const DEPTH_STAGE_ORDINAL: Record<DepthStage, number> = {
  registered: 1,
  summarized: 2,
  translated: 3,
  interpreted: 4,
};

export const REGION_LABELS: Record<Region, string> = {
  overseas: "해외",
  domestic: "국내",
};

export const ADOPTION_GRADE_LABELS: Record<AdoptionGrade, string> = {
  immediate: "즉시활용",
  pilot: "파일럿",
  internal_research: "내부연구",
  monitoring: "모니터링",
};

export const ADOPTION_GRADE_ICONS: Record<AdoptionGrade, string> = {
  immediate: "⚡",
  pilot: "🧪",
  internal_research: "📚",
  monitoring: "👀",
};

export const PRIMARY_TOPIC_LABELS: Record<PrimaryTopic, string> = {
  mortality: "사망률",
  longevity: "장수위험",
  mortality_improvement: "사망률 개선",
  underwriting: "언더라이팅",
  predictive_analytics: "예측분석",
  ifrs17: "IFRS 17",
  k_ics: "K-ICS",
  reinsurance: "재보험",
  persistency: "계약유지",
  claims: "보험금",
  investment: "자산운용",
  other: "기타",
};

export const BUSINESS_AREA_LABELS: Record<BusinessArea, string> = {
  product_development: "상품개발",
  risk_rate: "위험률",
  underwriting: "언더라이팅",
  ifrs17: "IFRS 17",
  k_ics: "K-ICS",
  reinsurance: "재보험",
  management_planning: "경영기획",
};

// === Adoption axes (5축 점수) ===
export interface AdoptionAxes {
  readonly data: number; // 0..5 데이터 적합성
  readonly regulation: number;
  readonly product: number;
  readonly difficulty: number;
  readonly effect: number;
}

// Default weights — per §D.3 governance
export const ADOPTION_WEIGHTS_DEFAULT = {
  data: 0.3,
  regulation: 0.25,
  product: 0.2,
  difficulty: 0.15,
  effect: 0.1,
} as const;
