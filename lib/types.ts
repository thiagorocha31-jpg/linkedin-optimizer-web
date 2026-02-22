/** Data models for LinkedIn profile analysis - 1:1 port from Python models.py */

export interface ExperienceEntry {
  title: string;
  company: string;
  duration_months: number;
  description: string;
  is_current: boolean;
}

export interface LinkedInProfile {
  name: string;
  headline: string;
  about: string;
  experience: ExperienceEntry[];
  skills: string[];
  education: string[];
  certifications: string[];
  featured_items: number;
  recommendations_count: number;
  connections_count: number;
  has_profile_photo: boolean;
  has_banner: boolean;
  has_custom_url: boolean;
  has_verification: boolean;
  open_to_work: boolean;
  open_to_work_private: boolean;
  posts_per_month: number;
  comments_per_week: number;
}

export interface TargetRole {
  name: string;
  description: string;
  tier1_keywords: string[];
  tier2_keywords: string[];
  tier3_keywords: string[];
  recommended_skills: string[];
  headline_examples: string[];
}

export type Severity = "critical" | "warning" | "info" | "positive";

export interface Finding {
  severity: Severity;
  message: string;
  fix?: string;
}

export interface SectionScore {
  name: string;
  score: number;
  max_score: number;
  findings: Finding[];
}

export interface KeywordCoverage {
  tier1_found: string[];
  tier1_missing: string[];
  tier2_found: string[];
  tier2_missing: string[];
  tier3_found: string[];
  tier3_missing: string[];
  coverage_pct: number;
}

export interface AnalysisReport {
  profile_name: string;
  target_role: string;
  overall_score: number;
  sections: SectionScore[];
  keyword_coverage: KeywordCoverage;
  top_recommendations: string[];
}

export const EMPTY_PROFILE: LinkedInProfile = {
  name: "",
  headline: "",
  about: "",
  experience: [],
  skills: [],
  education: [],
  certifications: [],
  featured_items: 0,
  recommendations_count: 0,
  connections_count: 0,
  has_profile_photo: false,
  has_banner: false,
  has_custom_url: false,
  has_verification: false,
  open_to_work: false,
  open_to_work_private: false,
  posts_per_month: 0,
  comments_per_week: 0,
};
