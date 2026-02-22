/**
 * Core analysis engine for LinkedIn profile optimization.
 * 1:1 port from Python analyzer.py - same weights, thresholds, regex patterns.
 */

import type {
  AnalysisReport,
  Finding,
  KeywordCoverage,
  LinkedInProfile,
  SectionScore,
  TargetRole,
} from "./types";

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function analyzeProfile(
  profile: LinkedInProfile,
  target: TargetRole
): AnalysisReport {
  const sections: SectionScore[] = [
    analyzeHeadline(profile, target),
    analyzeAbout(profile, target),
    analyzeExperience(profile, target),
    analyzeSkills(profile, target),
    analyzeCompleteness(profile),
    analyzeEngagement(profile),
  ];

  const keywordCov = analyzeKeywords(profile, target);

  // Weighted overall score
  const weights: Record<string, number> = {
    Headline: 0.2,
    "About Section": 0.2,
    Experience: 0.2,
    Skills: 0.15,
    "Profile Completeness": 0.1,
    "Engagement Signals": 0.15,
  };

  const overall = sections.reduce(
    (sum, s) => sum + s.score * (weights[s.name] ?? 0.1),
    0
  );

  // Top recommendations (critical first, then warnings, max 10)
  const recs: string[] = [];
  for (const section of sections) {
    for (const f of section.findings) {
      if (f.severity === "critical" && f.fix) {
        recs.push(`[${section.name}] ${f.fix}`);
      }
    }
  }
  for (const section of sections) {
    for (const f of section.findings) {
      if (f.severity === "warning" && f.fix && recs.length < 10) {
        recs.push(`[${section.name}] ${f.fix}`);
      }
    }
  }

  return {
    profile_name: profile.name || "Unknown",
    target_role: target.name,
    overall_score: Math.round(overall),
    sections,
    keyword_coverage: keywordCov,
    top_recommendations: recs.slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Section analyzers
// ---------------------------------------------------------------------------

function analyzeHeadline(
  profile: LinkedInProfile,
  target: TargetRole
): SectionScore {
  const h = profile.headline;
  const findings: Finding[] = [];
  let score = 100;

  if (!h) {
    return {
      name: "Headline",
      score: 0,
      max_score: 100,
      findings: [
        {
          severity: "critical",
          message: "No headline set",
          fix: "Add a headline using all 220 characters with target keywords",
        },
      ],
    };
  }

  // Length check
  const charUsage = h.length / 220;
  if (charUsage < 0.5) {
    score -= 20;
    findings.push({
      severity: "warning",
      message: `Headline only uses ${h.length}/220 characters (${Math.round(charUsage * 100)}%)`,
      fix: "Use more of the 220-character limit to include additional keywords",
    });
  } else if (charUsage >= 0.7) {
    findings.push({
      severity: "positive",
      message: `Good headline length: ${h.length}/220 characters (${Math.round(charUsage * 100)}%)`,
    });
  }

  // Keyword presence (Tier 1)
  const hLower = h.toLowerCase();
  const t1Found = target.tier1_keywords.filter((kw) =>
    hLower.includes(kw.toLowerCase())
  ).length;
  const t1Total = target.tier1_keywords.length;

  if (t1Total > 0) {
    const t1Pct = t1Found / t1Total;
    if (t1Pct < 0.2) {
      score -= 25;
      const missing = target.tier1_keywords
        .filter((kw) => !hLower.includes(kw.toLowerCase()))
        .slice(0, 3);
      findings.push({
        severity: "critical",
        message: `Only ${t1Found}/${t1Total} Tier 1 keywords found in headline`,
        fix: "Add priority keywords like: " + missing.join(", "),
      });
    } else if (t1Pct < 0.4) {
      score -= 10;
      const missing = target.tier1_keywords
        .filter((kw) => !hLower.includes(kw.toLowerCase()))
        .slice(0, 3);
      findings.push({
        severity: "warning",
        message: `${t1Found}/${t1Total} Tier 1 keywords in headline`,
        fix: "Consider adding: " + missing.join(", "),
      });
    } else {
      findings.push({
        severity: "positive",
        message: `Strong keyword presence: ${t1Found}/${t1Total} Tier 1 keywords`,
      });
    }
  }

  // Quantification check
  const hasNumbers = /\d+[%xX]|\$\d|\d+\s*(mo|month|year|yr)/.test(h);
  if (!hasNumbers) {
    score -= 15;
    findings.push({
      severity: "warning",
      message: "No quantified impact in headline",
      fix: "Add a metric like '2x EBITDA' or '$XM revenue' to stop recruiter scroll",
    });
  } else {
    findings.push({
      severity: "positive",
      message: "Headline includes quantified results (strong scroll-stopper)",
    });
  }

  // Seniority signal
  const seniorityTerms = [
    "svp",
    "vp",
    "president",
    "ceo",
    "coo",
    "cfo",
    "cto",
    "chief",
    "director",
    "partner",
    "head of",
    "executive",
  ];
  const hasSeniority = seniorityTerms.some((term) => hLower.includes(term));
  if (!hasSeniority) {
    score -= 10;
    findings.push({
      severity: "warning",
      message: "No seniority signal in headline",
      fix: "Include a title like SVP, VP, Chief, or Partner to signal level",
    });
  }

  // Credential signal
  const credentialTerms = [
    "bain",
    "mckinsey",
    "bcg",
    "wharton",
    "harvard",
    "stanford",
    "mba",
    "cpa",
    "cfa",
  ];
  const hasCredential = credentialTerms.some((term) => hLower.includes(term));
  if (hasCredential) {
    findings.push({
      severity: "positive",
      message: "Credential signal present (recruiters search for these)",
    });
  }

  // Generic buzzword penalty
  const buzzwords = [
    "dynamic",
    "passionate",
    "innovative",
    "results-driven",
    "thought leader",
    "guru",
    "ninja",
    "rockstar",
    "synergy",
    "leveraging",
    "paradigm",
  ];
  const foundBuzz = buzzwords.filter((bw) => hLower.includes(bw));
  if (foundBuzz.length > 0) {
    score -= 5 * foundBuzz.length;
    findings.push({
      severity: "warning",
      message: `Generic buzzwords detected: ${foundBuzz.join(", ")}`,
      fix: "Replace with specific, quantified achievements",
    });
  }

  return {
    name: "Headline",
    score: clamp(score),
    max_score: 100,
    findings,
  };
}

function analyzeAbout(
  profile: LinkedInProfile,
  target: TargetRole
): SectionScore {
  const a = profile.about;
  const findings: Finding[] = [];
  let score = 100;

  if (!a) {
    return {
      name: "About Section",
      score: 0,
      max_score: 100,
      findings: [
        {
          severity: "critical",
          message: "No About section",
          fix: "Write a 2,000-2,600 character About section with quantified achievements",
        },
      ],
    };
  }

  // Length
  if (a.length < 500) {
    score -= 25;
    findings.push({
      severity: "critical",
      message: `About section too short (${a.length}/2,600 chars)`,
      fix: "Expand to at least 1,500 characters to improve search indexing",
    });
  } else if (a.length < 1500) {
    score -= 10;
    findings.push({
      severity: "warning",
      message: `About section could be longer (${a.length}/2,600 chars)`,
      fix: "Aim for 2,000+ characters to maximize keyword coverage",
    });
  } else {
    findings.push({
      severity: "positive",
      message: `Good About length: ${a.length}/2,600 characters`,
    });
  }

  const aLower = a.toLowerCase();

  // Quantification density
  const numbers =
    a.match(/\d+[%xX]|\$[\d,.]+[MBK]?|\d+\s*(mo|month|year|yr|million|billion)/gi) || [];
  if (numbers.length === 0) {
    score -= 25;
    findings.push({
      severity: "critical",
      message: "No quantified results in About section",
      fix: "Add specific metrics: revenue, EBITDA, %, team sizes, timeframes",
    });
  } else if (numbers.length < 3) {
    score -= 10;
    findings.push({
      severity: "warning",
      message: `Only ${numbers.length} quantified metric(s) found`,
      fix: "Aim for 5+ metrics (EBITDA, revenue, team size, timeframes, %)",
    });
  } else {
    findings.push({
      severity: "positive",
      message: `Strong quantification: ${numbers.length} metrics found`,
    });
  }

  // Keyword coverage (Tier 1 + Tier 2)
  const allPriority = [...target.tier1_keywords, ...target.tier2_keywords];
  const found = allPriority.filter((kw) =>
    aLower.includes(kw.toLowerCase())
  ).length;

  if (allPriority.length > 0) {
    const kwPct = found / allPriority.length;
    if (kwPct < 0.25) {
      score -= 20;
      findings.push({
        severity: "critical",
        message: `Low keyword coverage in About: ${found}/${allPriority.length} (${Math.round(kwPct * 100)}%)`,
        fix: "Weave in more target keywords naturally throughout the section",
      });
    } else if (kwPct < 0.5) {
      score -= 10;
      findings.push({
        severity: "warning",
        message: `Moderate keyword coverage: ${found}/${allPriority.length} (${Math.round(kwPct * 100)}%)`,
      });
    } else {
      findings.push({
        severity: "positive",
        message: `Strong keyword coverage: ${found}/${allPriority.length} (${Math.round(kwPct * 100)}%)`,
      });
    }
  }

  // Emoji penalty
  const emojiPattern =
    /[\u{1F300}-\u{1F9FF}\u{2702}-\u{27B0}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]+/u;
  if (emojiPattern.test(a)) {
    score -= 15;
    findings.push({
      severity: "warning",
      message: "Emojis detected in About section",
      fix: "Remove emojis. LinkedIn's 2025+ algorithm penalizes template-looking content",
    });
  }

  // Generic CTA penalty
  const genericCtas = [
    "let's connect",
    "feel free to connect",
    "reach out",
    "open to new opportunities",
  ];
  if (genericCtas.some((cta) => aLower.includes(cta))) {
    score -= 5;
    findings.push({
      severity: "info",
      message: "Generic CTA detected ('Let's connect' etc.)",
      fix: "Remove generic CTAs. Executives don't need them; they signal junior positioning",
    });
  }

  // Weak opening check
  const weakOpenings = [
    "greetings",
    "hello",
    "hi there",
    "welcome to my",
    "i am a",
  ];
  const trimmedLower = aLower.trim();
  if (weakOpenings.some((wo) => trimmedLower.startsWith(wo))) {
    score -= 10;
    findings.push({
      severity: "warning",
      message: "Weak opening detected",
      fix: "Open with a bold positioning statement or quantified result, not a greeting",
    });
  }

  return {
    name: "About Section",
    score: clamp(score),
    max_score: 100,
    findings,
  };
}

function analyzeExperience(
  profile: LinkedInProfile,
  target: TargetRole
): SectionScore {
  const findings: Finding[] = [];
  let score = 100;

  if (!profile.experience.length) {
    return {
      name: "Experience",
      score: 0,
      max_score: 100,
      findings: [
        {
          severity: "critical",
          message: "No experience entries",
          fix: "Add at least 3 experience entries with detailed descriptions",
        },
      ],
    };
  }

  // Number of entries
  if (profile.experience.length < 3) {
    score -= 10;
    findings.push({
      severity: "warning",
      message: `Only ${profile.experience.length} experience entries`,
      fix: "Add more experience entries for better search indexing",
    });
  }

  // Analyze each entry
  let totalQuant = 0;
  let entriesWithoutDescription = 0;
  let allExpText = "";

  for (const exp of profile.experience) {
    const d = exp.description;
    allExpText += " " + d.toLowerCase();

    if (!d || d.length < 50) {
      entriesWithoutDescription++;
      continue;
    }

    // Count quantified results
    const numbers =
      d.match(
        /\d+[%xX]|\$[\d,.]+[MBK]?|\d+\s*(mo|month|year|million|billion)/gi
      ) || [];
    totalQuant += numbers.length;
  }

  if (entriesWithoutDescription > 0) {
    score -= 10 * entriesWithoutDescription;
    findings.push({
      severity: "critical",
      message: `${entriesWithoutDescription} experience entries have no/minimal description`,
      fix: "Add detailed descriptions with quantified achievements to every role",
    });
  }

  // Overall quantification
  if (totalQuant === 0) {
    score -= 25;
    findings.push({
      severity: "critical",
      message: "No quantified results across all experience entries",
      fix: "Add $ amounts, %, team sizes, and timeframes to every bullet point",
    });
  } else if (totalQuant < profile.experience.length * 2) {
    score -= 10;
    findings.push({
      severity: "warning",
      message: `Low quantification density (${totalQuant} metrics across ${profile.experience.length} roles)`,
      fix: "Aim for 3-5 quantified bullets per role",
    });
  } else {
    findings.push({
      severity: "positive",
      message: `Strong quantification: ${totalQuant} metrics across experience`,
    });
  }

  // Keyword coverage in experience
  const allKeywords = [
    ...target.tier1_keywords,
    ...target.tier2_keywords,
    ...target.tier3_keywords,
  ];
  const kwFound = allKeywords.filter((kw) =>
    allExpText.includes(kw.toLowerCase())
  ).length;

  if (allKeywords.length > 0) {
    const pct = kwFound / allKeywords.length;
    if (pct < 0.3) {
      score -= 15;
      findings.push({
        severity: "warning",
        message: `Low keyword presence in experience: ${kwFound}/${allKeywords.length} (${Math.round(pct * 100)}%)`,
        fix: "Weave target keywords into experience descriptions",
      });
    } else {
      findings.push({
        severity: "positive",
        message: `Good keyword coverage in experience: ${Math.round(pct * 100)}%`,
      });
    }
  }

  return {
    name: "Experience",
    score: clamp(score),
    max_score: 100,
    findings,
  };
}

function analyzeSkills(
  profile: LinkedInProfile,
  target: TargetRole
): SectionScore {
  const findings: Finding[] = [];
  let score = 100;
  const skills = profile.skills;
  const skillsLower = skills.map((s) => s.toLowerCase());

  if (!skills.length) {
    return {
      name: "Skills",
      score: 0,
      max_score: 100,
      findings: [
        {
          severity: "critical",
          message: "No skills listed",
          fix: "Add all 50 skills (profiles with 5+ skills get 17x more views)",
        },
      ],
    };
  }

  // Count
  if (skills.length < 10) {
    score -= 30;
    findings.push({
      severity: "critical",
      message: `Only ${skills.length} skills listed (max 50)`,
      fix: `Add ${50 - skills.length} more skills to maximize recruiter search matches`,
    });
  } else if (skills.length < 30) {
    score -= 15;
    findings.push({
      severity: "warning",
      message: `${skills.length} skills listed (max 50)`,
      fix: `Add ${50 - skills.length} more skills for better coverage`,
    });
  } else if (skills.length >= 40) {
    findings.push({
      severity: "positive",
      message: `Strong skills count: ${skills.length}/50`,
    });
  }

  // Coverage against recommended skills
  const rec = target.recommended_skills;
  if (rec.length > 0) {
    const matched = rec.filter((rs) =>
      skillsLower.includes(rs.toLowerCase())
    ).length;
    const missing = rec.filter(
      (rs) => !skillsLower.includes(rs.toLowerCase())
    );
    const pct = matched / rec.length;

    if (pct < 0.3) {
      score -= 20;
      findings.push({
        severity: "critical",
        message: `Only ${matched}/${rec.length} recommended skills present (${Math.round(pct * 100)}%)`,
        fix: "Add these critical skills: " + missing.slice(0, 5).join(", "),
      });
    } else if (pct < 0.6) {
      score -= 10;
      findings.push({
        severity: "warning",
        message: `${matched}/${rec.length} recommended skills present (${Math.round(pct * 100)}%)`,
        fix: "Consider adding: " + missing.slice(0, 5).join(", "),
      });
    } else {
      findings.push({
        severity: "positive",
        message: `Strong skill alignment: ${matched}/${rec.length} recommended skills (${Math.round(pct * 100)}%)`,
      });
    }
  }

  return {
    name: "Skills",
    score: clamp(score),
    max_score: 100,
    findings,
  };
}

function analyzeCompleteness(profile: LinkedInProfile): SectionScore {
  const findings: Finding[] = [];
  let score = 0;

  const checks: [boolean, number, string, string][] = [
    [!!profile.headline, 15, "Headline present", "Add a headline"],
    [!!profile.about, 15, "About section present", "Write an About section"],
    [
      profile.experience.length >= 1,
      15,
      "Experience listed",
      "Add experience entries",
    ],
    [
      profile.skills.length >= 5,
      10,
      "5+ skills listed",
      "Add at least 5 skills",
    ],
    [profile.education.length >= 1, 5, "Education listed", "Add education"],
    [
      profile.has_profile_photo,
      15,
      "Profile photo set",
      "Add a professional headshot (21x more views)",
    ],
    [
      profile.has_banner,
      5,
      "Banner image set",
      "Add an executive-caliber banner image",
    ],
    [
      profile.has_custom_url,
      5,
      "Custom URL set",
      "Set a clean custom URL (linkedin.com/in/yourname)",
    ],
    [
      profile.has_verification,
      5,
      "Profile verified",
      "Get Blue Check verification (boosts search ranking)",
    ],
    [
      profile.open_to_work_private,
      10,
      "Open to Work (private)",
      "Enable private Open to Work (2x recruiter messages)",
    ],
  ];

  for (const [condition, points, posMsg, fixMsg] of checks) {
    if (condition) {
      score += points;
      findings.push({ severity: "positive", message: posMsg });
    } else {
      findings.push({
        severity: points >= 10 ? "critical" : "warning",
        message: `Missing: ${posMsg}`,
        fix: fixMsg,
      });
    }
  }

  return {
    name: "Profile Completeness",
    score: Math.min(100, score),
    max_score: 100,
    findings,
  };
}

function analyzeEngagement(profile: LinkedInProfile): SectionScore {
  const findings: Finding[] = [];
  let score = 0;

  // Posts per month
  if (profile.posts_per_month >= 2) {
    score += 30;
    findings.push({
      severity: "positive",
      message: `Good posting frequency: ${profile.posts_per_month}/month`,
    });
  } else if (profile.posts_per_month >= 0.5) {
    score += 15;
    findings.push({
      severity: "info",
      message: `Posting ${profile.posts_per_month}/month`,
      fix: "Increase to 2 posts/month for optimal visibility",
    });
  } else {
    findings.push({
      severity: "critical",
      message: "Low/no posting activity",
      fix: "Post 1-2x per month. Active profiles get 40% more recruiter visibility",
    });
  }

  // Comments per week
  if (profile.comments_per_week >= 3) {
    score += 30;
    findings.push({
      severity: "positive",
      message: `Strong commenting: ${profile.comments_per_week}/week`,
    });
  } else if (profile.comments_per_week >= 1) {
    score += 15;
    findings.push({
      severity: "info",
      message: `Commenting ${profile.comments_per_week}/week`,
      fix: "Increase to 2-3 comments/week (250% boost in profile views)",
    });
  } else {
    findings.push({
      severity: "critical",
      message: "No commenting activity",
      fix: "Comment on 2-3 posts/week with 10+ word substantive comments",
    });
  }

  // Featured section
  if (profile.featured_items >= 3) {
    score += 15;
    findings.push({
      severity: "positive",
      message: `${profile.featured_items} featured items`,
    });
  } else if (profile.featured_items >= 1) {
    score += 8;
    findings.push({
      severity: "info",
      message: `${profile.featured_items} featured item(s)`,
      fix: "Add 3-4 featured items (articles, case studies, media appearances)",
    });
  } else {
    findings.push({
      severity: "warning",
      message: "No featured items",
      fix: "Add thought leadership content to Featured section",
    });
  }

  // Recommendations
  if (profile.recommendations_count >= 3) {
    score += 15;
    findings.push({
      severity: "positive",
      message: `${profile.recommendations_count} recommendations`,
    });
  } else if (profile.recommendations_count >= 1) {
    score += 8;
    findings.push({
      severity: "info",
      message: `${profile.recommendations_count} recommendation(s)`,
      fix: "Request 2-3 more recommendations from colleagues/clients",
    });
  } else {
    findings.push({
      severity: "warning",
      message: "No recommendations",
      fix: "Request 3-5 recommendations (endorsed profiles rank higher)",
    });
  }

  // Connections
  if (profile.connections_count >= 500) {
    score += 10;
    findings.push({
      severity: "positive",
      message: `${profile.connections_count}+ connections`,
    });
  } else if (profile.connections_count >= 200) {
    score += 5;
    findings.push({
      severity: "info",
      message: `${profile.connections_count} connections`,
      fix: "Expand network to 500+ (improves search visibility via degree proximity)",
    });
  } else {
    findings.push({
      severity: "warning",
      message: `Low connection count: ${profile.connections_count}`,
      fix: "Connect with 10-15 PE professionals weekly",
    });
  }

  return {
    name: "Engagement Signals",
    score: Math.min(100, score),
    max_score: 100,
    findings,
  };
}

// ---------------------------------------------------------------------------
// Keyword coverage analysis
// ---------------------------------------------------------------------------

function analyzeKeywords(
  profile: LinkedInProfile,
  target: TargetRole
): KeywordCoverage {
  const fullText = [
    profile.headline,
    profile.about,
    ...profile.experience.map((exp) => exp.description + " " + exp.title),
    ...profile.skills,
    ...profile.education,
  ]
    .join(" ")
    .toLowerCase();

  function splitFound(keywords: string[]): [string[], string[]] {
    const found = keywords.filter((kw) => fullText.includes(kw.toLowerCase()));
    const missing = keywords.filter(
      (kw) => !fullText.includes(kw.toLowerCase())
    );
    return [found, missing];
  }

  const [t1Found, t1Missing] = splitFound(target.tier1_keywords);
  const [t2Found, t2Missing] = splitFound(target.tier2_keywords);
  const [t3Found, t3Missing] = splitFound(target.tier3_keywords);

  const total =
    target.tier1_keywords.length +
    target.tier2_keywords.length +
    target.tier3_keywords.length;
  const foundTotal = t1Found.length + t2Found.length + t3Found.length;
  const pct = total > 0 ? (foundTotal / total) * 100 : 0;

  return {
    tier1_found: t1Found,
    tier1_missing: t1Missing,
    tier2_found: t2Found,
    tier2_missing: t2Missing,
    tier3_found: t3Found,
    tier3_missing: t3Missing,
    coverage_pct: Math.round(pct * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function clamp(score: number): number {
  return Math.max(0, Math.min(100, score));
}
