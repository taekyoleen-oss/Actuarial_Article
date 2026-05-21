import { z } from "zod";
import {
  ADOPTION_GRADES,
  BUSINESS_AREAS,
  PRIMARY_TOPICS,
} from "@/types/domain";

/**
 * Zod schemas for validating LLM JSON outputs (per §2.6 success criteria).
 * Each pipeline step must parse LLM output through the matching schema.
 */

export const SummarizationOutput = z.object({
  summary_ko: z.string().min(30).max(800),
  key_points_ko: z.array(z.string().min(10).max(200)).min(2).max(6),
  primary_topic: z.enum(PRIMARY_TOPICS),
});
export type SummarizationOutput = z.infer<typeof SummarizationOutput>;

export const TranslationOutput = z.object({
  content_md: z.string().min(50),
  glossary_terms_used: z.array(z.string()),
  uncertain_segments: z
    .array(
      z.object({
        original: z.string(),
        translated: z.string(),
        reason: z.string(),
      }),
    )
    .default([]),
});
export type TranslationOutput = z.infer<typeof TranslationOutput>;

export const InterpretationOutput = z.object({
  summary_ko: z.string().min(50).max(1200),
  korea_applicability: z.string().min(50).max(1500),
  required_korea_data: z.string().min(20).max(1000),
  regulatory_impact: z.string().min(20).max(2000),
  target_departments: z.array(z.enum(BUSINESS_AREAS)).min(1).max(4),
  adoption_difficulty: z.string().min(20).max(500),
  adoption_notes: z.string().max(2000).optional(),
});
export type InterpretationOutput = z.infer<typeof InterpretationOutput>;

export const AdoptionAxesOutput = z.object({
  data: z.number().min(0).max(5),
  regulation: z.number().min(0).max(5),
  product: z.number().min(0).max(5),
  difficulty: z.number().min(0).max(5),
  effect: z.number().min(0).max(5),
  rationale: z.string().min(30).max(800),
});
export type AdoptionAxesOutput = z.infer<typeof AdoptionAxesOutput>;

export const AdoptionGradeOutput = z.object({
  grade: z.enum(ADOPTION_GRADES),
  score: z.number().min(0).max(5),
  rationale: z.string(),
});
export type AdoptionGradeOutput = z.infer<typeof AdoptionGradeOutput>;
