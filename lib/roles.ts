/** Target role keyword databases - 1:1 port from Python keywords/roles.py */

import type { TargetRole } from "./types";

const ROLE_REGISTRY: Record<string, TargetRole> = {};

function registerRole(role: TargetRole): void {
  ROLE_REGISTRY[role.name.toLowerCase()] = role;
}

export function getRole(name: string): TargetRole | undefined {
  return ROLE_REGISTRY[name.toLowerCase()];
}

export function listRoles(): TargetRole[] {
  return Object.values(ROLE_REGISTRY);
}

// ---------------------------------------------------------------------------
// PE Operating Partner
// ---------------------------------------------------------------------------
registerRole({
  name: "PE Operating Partner",
  description:
    "Operating partner at a PE firm driving value creation across portfolio companies",
  tier1_keywords: [
    "value creation",
    "private equity",
    "operating partner",
    "portfolio operations",
    "enterprise transformation",
    "middle market",
    "P&L",
    "EBITDA",
  ],
  tier2_keywords: [
    "EBITDA improvement",
    "operational excellence",
    "due diligence",
    "100-day plan",
    "investment thesis",
    "revenue growth",
    "margin expansion",
    "cost optimization",
    "commercial excellence",
    "digital transformation",
    "AI",
    "cross-functional",
    "change management",
    "board reporting",
    "post-acquisition",
  ],
  tier3_keywords: [
    "management consulting",
    "Bain",
    "McKinsey",
    "BCG",
    "multi-site operations",
    "supply chain",
    "pricing strategy",
    "go-to-market",
    "sales effectiveness",
    "process automation",
    "M&A integration",
    "carve-out",
    "stakeholder management",
    "financial modeling",
    "data-driven",
    "lean operations",
  ],
  recommended_skills: [
    "Value Creation",
    "Private Equity",
    "Enterprise Transformation",
    "Strategic Planning",
    "Due Diligence",
    "M&A Integration",
    "Post-Merger Integration",
    "Investment Thesis",
    "Portfolio Management",
    "Business Strategy",
    "Corporate Strategy",
    "Growth Strategy",
    "Operational Excellence",
    "P&L Management",
    "EBITDA Improvement",
    "Cost Optimization",
    "Pricing Strategy",
    "Supply Chain Management",
    "Process Improvement",
    "Change Management",
    "Organizational Transformation",
    "Revenue Growth",
    "Commercial Excellence",
    "Go-to-Market Strategy",
    "Sales Strategy",
    "Business Development",
    "Digital Transformation",
    "Artificial Intelligence",
    "AI Implementation",
    "Data Analytics",
    "Business Intelligence",
    "Process Automation",
    "Technology Strategy",
    "Executive Leadership",
    "Cross-Functional Leadership",
    "Team Building",
    "Stakeholder Management",
    "Board Reporting",
    "Program Management",
    "Management Consulting",
    "Financial Modeling",
  ],
  headline_examples: [
    "PE Value Creation: 2x EBITDA (10mo), 80% Lift (18mo) | I Build the AI Systems That Transform Portfolio Operations | Bain | Wharton",
    "SVP Transformation | 2x EBITDA in 10 Months | PE Portfolio Operations & AI-Powered Value Creation | Bain & Company | Wharton MBA",
    "Value Creation | PE Portfolio Transformation | Operating Partner | 2x EBITDA in 10mo | AI, Pricing, Commercial & Operational Excellence | Bain | Wharton",
  ],
});

// ---------------------------------------------------------------------------
// Portfolio Company CEO / President / COO
// ---------------------------------------------------------------------------
registerRole({
  name: "Portfolio Company CEO/COO",
  description:
    "President, CEO, COO, or Chief Transformation Officer at a PE-backed middle-market company",
  tier1_keywords: [
    "president",
    "CEO",
    "COO",
    "chief transformation officer",
    "P&L",
    "enterprise transformation",
    "operational excellence",
    "middle market",
    "private equity",
    "value creation",
  ],
  tier2_keywords: [
    "EBITDA",
    "revenue growth",
    "margin expansion",
    "cost optimization",
    "organizational transformation",
    "digital transformation",
    "commercial excellence",
    "board reporting",
    "investor relations",
    "strategic planning",
    "turnaround",
    "business transformation",
    "AI",
    "go-to-market",
    "cross-functional leadership",
  ],
  tier3_keywords: [
    "management consulting",
    "Bain",
    "McKinsey",
    "BCG",
    "supply chain",
    "pricing strategy",
    "M&A integration",
    "post-acquisition",
    "100-day plan",
    "due diligence",
    "team building",
    "culture transformation",
    "process automation",
    "ERP",
    "lean operations",
    "six sigma",
    "continuous improvement",
  ],
  recommended_skills: [
    "P&L Management",
    "Enterprise Transformation",
    "Operational Excellence",
    "Strategic Planning",
    "Executive Leadership",
    "Value Creation",
    "Private Equity",
    "Digital Transformation",
    "Revenue Growth",
    "EBITDA Improvement",
    "Cost Optimization",
    "Organizational Transformation",
    "Change Management",
    "Board Reporting",
    "Commercial Excellence",
    "Go-to-Market Strategy",
    "Pricing Strategy",
    "Supply Chain Management",
    "Team Building",
    "Cross-Functional Leadership",
    "Stakeholder Management",
    "Business Development",
    "Artificial Intelligence",
    "Process Automation",
    "Data Analytics",
    "Business Intelligence",
    "Technology Strategy",
    "M&A Integration",
    "Due Diligence",
    "Management Consulting",
    "Financial Modeling",
    "Program Management",
    "Sales Strategy",
    "Growth Strategy",
    "Turnaround Management",
    "Business Transformation",
  ],
  headline_examples: [
    "CEO/COO | PE-Backed Transformation | 2x EBITDA in 10mo | AI-Powered Operations | Bain & Company | Wharton MBA",
    "Chief Transformation Officer | Middle Market Value Creation | 60-80% EBITDA Lift | AI Builder + Operator | Bain | Wharton",
  ],
});

// ---------------------------------------------------------------------------
// Custom (empty template for user-defined roles)
// ---------------------------------------------------------------------------
registerRole({
  name: "Custom",
  description: "Custom role - provide your own keywords",
  tier1_keywords: [],
  tier2_keywords: [],
  tier3_keywords: [],
  recommended_skills: [],
  headline_examples: [],
});
