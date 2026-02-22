/**
 * Verification script: ensures TypeScript engine produces identical scores to Python.
 * Expected: thiago-current.json → 37, thiago-optimized.json → 92
 */

import { analyzeProfile } from "../lib/analyzer";
import { getRole } from "../lib/roles";
import type { LinkedInProfile } from "../lib/types";

// Inline the test profiles (from Python CLI's profiles/ directory)
const currentProfile: LinkedInProfile = {
  name: "Thiago Rocha",
  headline: "Dynamic Strategy & Operations Leader | Innovator | Relationship Builder",
  about: "Greetings! I'm a dynamic Strategy & Operations Leader with a talent for harnessing technological advancements to drive organizational growth and innovation. With a track record spanning diverse industries, I specialize in crafting high-impact initiatives, innovative go-to-market strategies, and optimizing sales management.\n\n\ud83d\udd0d What I Do:\nI orchestrate high-impact cross-functional initiatives to fuel value creation and strategic growth in various sectors.\nMy passion lies in building and mentoring high-performing teams, empowering them to excel in implementing transformative strategies.\nI lead innovative cross-functional strategies for Technology, Retail, CPG, and Healthcare companies, always focusing on long-term value and impact.\nCultivating and maintaining relationships with C-level executives is my forte, enabling the formulation and execution of long-term, impactful, and sustainable strategies.\nDistilling complex and unstructured data into powerful insights is second nature, informing decision-making and strategy development.\n\n\ud83d\udca1 My Expertise Includes:\nManagement Consulting & Strategic Growth\nProgram & Project Management\nBusiness Strategy & Development\nData Processing & Analysis\nDigital Strategy & B2B SaaS\n\n\ud83c\udf1f Why I am Different:\nI bring together analytical prowess and creative thinking, allowing me to navigate ambiguity and devise scalable and efficient solutions.\nI'm a lifelong learner, constantly expanding my knowledge to adapt to the ever-evolving technological landscape.\nI firmly believe in the power of positive and insightful leadership to inspire high-performing teams and foster innovation.\n\nPeople who know me value my top-tier problem-solving and critical thinking skills, coupled with my ability to communicate proficiently, and engage at the executive level. I'm passionate about making each day count, learning, working, and helping others to create a net positive impact.\n\nLet's connect! I'm always open to meeting like-minded professionals, exploring collaborations, and discussing the latest in technology and strategy. Feel free to connect with me here on LinkedIn.",
  experience: [
    {
      title: "SVP Transformation",
      company: "PE-Backed Lab Services Platform",
      duration_months: 18,
      description: "Leading transformation initiatives across the organization.",
      is_current: true,
    },
    {
      title: "VP Operations",
      company: "PE-Backed Specialty Manufacturer",
      duration_months: 10,
      description: "Drove operational turnaround.",
      is_current: false,
    },
    {
      title: "Consultant",
      company: "Bain & Company",
      duration_months: 36,
      description: "Management consulting across technology, retail, and healthcare sectors.",
      is_current: false,
    },
  ],
  skills: [
    "Management Consulting", "Strategic Growth", "Program Management",
    "Business Strategy", "Data Processing", "Digital Strategy", "B2B SaaS",
    "Project Management", "Cross-functional Leadership",
  ],
  education: ["MBA, The Wharton School"],
  certifications: [],
  featured_items: 0,
  recommendations_count: 1,
  connections_count: 400,
  has_profile_photo: true,
  has_banner: false,
  has_custom_url: true,
  has_verification: false,
  open_to_work: false,
  open_to_work_private: false,
  posts_per_month: 0,
  comments_per_week: 0,
};

const optimizedProfile: LinkedInProfile = {
  name: "Thiago Rocha",
  headline: "PE Value Creation: 2x EBITDA (10mo), 80% Lift (18mo) | I Build the AI Systems That Transform Portfolio Operations | Bain | Wharton",
  about: "I transform PE-backed middle-market businesses and build the AI systems that make the transformation stick at 10x speed.\n\nTHE RESULTS\nMost recently at a PE-backed national lab services platform, I'm leading enterprise-wide transformation delivering 60-80% EBITDA improvement in under 18 months across pricing, operations, commercial excellence, and technology.\n\nPreviously, I drove the full operational turnaround of a PE-backed specialty manufacturer, doubling EBITDA in 10 months through pricing intelligence, sales effectiveness, and process automation.\n\nWHAT I ACTUALLY BUILD\nMost transformation executives make slides. I make slides AND ship production software.\n\nI've personally architected and deployed:\n- AI-powered value creation platform managing 20+ concurrent transformation workstreams\n- Automated quoting engine cutting customer response from days to minutes\n- M&A target intelligence system for PE deal origination and screening\n- Real-time BI dashboards replacing manual board reporting\n- Pricing optimization, procurement intelligence, and sales prospecting tools\n\nThese aren't proofs of concept. They're live systems running in production today.\n\nWHERE I CREATE VALUE\n- Post-acquisition 100-day plans and operational transformation\n- Pricing and commercial excellence (margin expansion)\n- AI/automation for operational leverage at enterprise scale\n- Cross-functional program management across ops, tech, and commercial\n- Due diligence support (operational, commercial, technology)\n\nBACKGROUND\nBain & Company (management consulting) serving Fortune 500 and PE clients across technology, industrial, and healthcare sectors. Wharton MBA. Bilingual English/Portuguese with deep US and Latin America market experience.",
  experience: [
    {
      title: "SVP Transformation",
      company: "PE-Backed National Lab Services Platform",
      duration_months: 18,
      description: "Leading enterprise-wide transformation of a PE-backed multi-site lab services platform, delivering 60-80% EBITDA improvement across all operational and commercial functions.\n\n- Spearheading 20+ concurrent value creation workstreams across pricing, procurement, staffing, commercial excellence, and operational efficiency\n- Built and deployed AI-powered initiative tracking platform managing the full transformation portfolio with real-time board reporting\n- Architected automated quoting system reducing lab quote turnaround from days to minutes\n- Led pricing reset and profitability optimization across the entire service portfolio\n- Designed business intelligence platforms for food labs, agriculture labs, and sales operations, replacing manual reporting with real-time dashboards\n- Driving procurement optimization and staffing/capacity analytics programs\n- Preparing and presenting board materials and investor updates on value creation progress",
      is_current: true,
    },
    {
      title: "VP Operations",
      company: "PE-Backed Specialty Manufacturer",
      duration_months: 10,
      description: "Drove full operational turnaround of a PE-backed specialty manufacturer.\n\n- Doubled EBITDA within 10 months through integrated pricing, commercial, and operational transformation\n- Led pricing intelligence implementation capturing significant margin expansion\n- Redesigned sales processes and go-to-market strategy for key accounts\n- Implemented process automation reducing manual operations and improving throughput\n- Managed cross-functional execution across sales, operations, and finance",
      is_current: false,
    },
    {
      title: "Consultant / Senior Associate",
      company: "Bain & Company",
      duration_months: 36,
      description: "Management consultant serving Fortune 500 and PE clients on strategy, operations, and transformation across technology, industrial, and healthcare sectors.\n\n- Led due diligence and post-acquisition value creation planning for PE sponsors\n- Developed go-to-market strategies, pricing optimization, and operational improvement programs for portfolio companies\n- Managed cross-functional teams of 5-15 on high-impact strategic initiatives\n- Specialized in technology, retail/CPG, and healthcare transformation engagements\n- Built analytical models and executive presentations for C-suite and board audiences",
      is_current: false,
    },
  ],
  skills: [
    "Value Creation", "Private Equity", "Enterprise Transformation",
    "Strategic Planning", "Due Diligence", "M&A Integration",
    "Post-Merger Integration", "Investment Thesis", "Portfolio Management",
    "Business Strategy", "Corporate Strategy", "Growth Strategy",
    "Market Entry Strategy", "Operational Excellence", "P&L Management",
    "EBITDA Improvement", "Cost Optimization", "Pricing Strategy",
    "Supply Chain Management", "Process Improvement", "Lean Operations",
    "Change Management", "Organizational Transformation",
    "Revenue Growth", "Commercial Excellence", "Go-to-Market Strategy",
    "Sales Strategy", "Business Development", "Customer Strategy",
    "Market Analysis", "Competitive Intelligence",
    "Digital Transformation", "Artificial Intelligence", "AI Implementation",
    "Data Analytics", "Business Intelligence", "Process Automation",
    "Technology Strategy", "Software Development",
    "Executive Leadership", "Cross-Functional Leadership", "Team Building",
    "Stakeholder Management", "Board Reporting", "Program Management",
    "Project Management", "Management Consulting", "Financial Modeling",
    "Lab Services", "Manufacturing",
  ],
  education: ["MBA, The Wharton School, University of Pennsylvania"],
  certifications: [],
  featured_items: 3,
  recommendations_count: 5,
  connections_count: 500,
  has_profile_photo: true,
  has_banner: true,
  has_custom_url: true,
  has_verification: true,
  open_to_work: true,
  open_to_work_private: true,
  posts_per_month: 2,
  comments_per_week: 3,
};

// Run verification
const target = getRole("PE Operating Partner")!;

const currentReport = analyzeProfile(currentProfile, target);
const optimizedReport = analyzeProfile(optimizedProfile, target);

console.log("=== CURRENT PROFILE ===");
console.log(`Overall: ${currentReport.overall_score} (expected: 37)`);
for (const s of currentReport.sections) {
  console.log(`  ${s.name}: ${s.score}`);
}
console.log();

console.log("=== OPTIMIZED PROFILE ===");
console.log(`Overall: ${optimizedReport.overall_score} (expected: 92)`);
for (const s of optimizedReport.sections) {
  console.log(`  ${s.name}: ${s.score}`);
}
console.log();

// Verify
const currentPass = currentReport.overall_score === 37;
const optimizedPass = optimizedReport.overall_score === 92;

console.log(`Current profile: ${currentPass ? "PASS" : "FAIL"} (${currentReport.overall_score})`);
console.log(`Optimized profile: ${optimizedPass ? "PASS" : "FAIL"} (${optimizedReport.overall_score})`);

if (!currentPass || !optimizedPass) {
  process.exit(1);
}
console.log("\nAll checks passed!");
