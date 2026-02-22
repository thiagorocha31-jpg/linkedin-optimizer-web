/**
 * Prompt templates for AI profile generation.
 * Encodes the analyzer's scoring rules so Claude generates high-scoring content.
 */

import type { GeneratedDraft, LinkedInProfile, TargetRole } from "./types";

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

export function buildSystemPrompt(role: TargetRole): string {
  return `You are an expert LinkedIn profile optimizer for senior executives targeting PE (private equity) and transformation roles.

Your job: generate optimized LinkedIn profile content that will score 85+ on our scoring rubric.

## Target Role: ${role.name}
${role.description}

## Scoring Rubric (these rules determine the score)

### Headline (20% weight)
- Use ALL 220 characters available (70%+ usage = good)
- Must include Tier 1 keywords (at least 2-3): ${role.tier1_keywords.join(", ")}
- Must include quantified impact (e.g., "2x EBITDA", "$XM revenue", "80% lift in 18mo")
- Must include a seniority signal (SVP, VP, CEO, COO, Chief, Partner, Director, Head of)
- Credentials boost score (Bain, McKinsey, BCG, Wharton, Harvard, Stanford, MBA, CPA, CFA)
- NEVER use buzzwords: dynamic, passionate, innovative, results-driven, thought leader, guru, ninja, rockstar, synergy, leveraging, paradigm
- Use | as separator between segments

### About Section (20% weight)
- Target 2,000-2,600 characters (max 2,600)
- Must include 5+ quantified metrics (revenue, EBITDA, %, team sizes, timeframes)
- Must cover 50%+ of Tier 1 + Tier 2 keywords naturally woven in
- Open with a bold positioning statement or quantified result, NOT a greeting
- NO emojis anywhere
- NO generic CTAs ("let's connect", "feel free to reach out", "open to new opportunities")
- NO weak openings ("Greetings", "Hello", "Hi there", "Welcome to my", "I am a")
- Structure: Opening hook → Track record → Approach/philosophy → Specific achievements → Forward-looking statement

### Skills (15% weight)
- Suggest exactly 50 skills (LinkedIn max) to maximize recruiter search matches
- Prioritize these recommended skills first: ${role.recommended_skills.slice(0, 20).join(", ")}
- Then add complementary skills from Tier 1-3 keywords not already covered
- Fill remaining slots with broadly relevant executive skills

### Experience (20% weight for scoring)
- Generate structured experience entries based on the resume/context provided
- Each entry needs: title, company, duration_months, description, is_current
- Each description must be 200+ characters with 3-5 quantified metrics ($, %, team sizes, timeframes)
- Weave target keywords naturally into descriptions
- Focus on impact and results, not responsibilities
- Include at least 3 experience entries
- Mark the most recent role as is_current: true

## Keywords to Weave In

**Tier 1 (must-have, highest impact):** ${role.tier1_keywords.join(", ")}

**Tier 2 (should-have):** ${role.tier2_keywords.join(", ")}

**Tier 3 (nice-to-have):** ${role.tier3_keywords.join(", ")}

## Headline Examples for Reference
${role.headline_examples.map((ex) => `- ${ex}`).join("\n")}

## Output Format
Return ONLY valid JSON matching this exact structure:
{
  "headline": "string (max 220 chars)",
  "about": "string (1800-2600 chars, use \\n for line breaks)",
  "skills": ["string array, exactly 50 items"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration_months": number,
      "description": "string (200+ chars with quantified results)",
      "is_current": boolean
    }
  ]
}`;
}

// ---------------------------------------------------------------------------
// User prompt builder
// ---------------------------------------------------------------------------

export function buildUserPrompt(
  context: { resumeText: string; notes: string },
  currentProfile: LinkedInProfile | null
): string {
  const parts: string[] = [];

  parts.push("Generate an optimized LinkedIn profile based on the following context.");

  if (context.resumeText) {
    parts.push(`\n## Resume Content\n${context.resumeText}`);
  }

  if (context.notes) {
    parts.push(`\n## Additional Context from User\n${context.notes}`);
  }

  if (currentProfile) {
    const hasContent =
      currentProfile.headline ||
      currentProfile.about ||
      currentProfile.experience.length > 0 ||
      currentProfile.skills.length > 0;

    if (hasContent) {
      parts.push("\n## Current Profile (use as seed, improve upon it)");
      if (currentProfile.name) parts.push(`Name: ${currentProfile.name}`);
      if (currentProfile.headline)
        parts.push(`Current Headline: ${currentProfile.headline}`);
      if (currentProfile.about)
        parts.push(`Current About: ${currentProfile.about}`);
      if (currentProfile.experience.length > 0) {
        parts.push("\nCurrent Experience:");
        for (const exp of currentProfile.experience) {
          parts.push(
            `- ${exp.title} at ${exp.company} (${exp.duration_months}mo${exp.is_current ? ", current" : ""}): ${exp.description}`
          );
        }
      }
      if (currentProfile.skills.length > 0) {
        parts.push(`\nCurrent Skills: ${currentProfile.skills.join(", ")}`);
      }
      if (currentProfile.education.length > 0) {
        parts.push(`Education: ${currentProfile.education.join(", ")}`);
      }
    }
  }

  parts.push(
    "\nGenerate the optimized profile now. Return ONLY the JSON object, no markdown fences."
  );

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Single section regeneration prompt
// ---------------------------------------------------------------------------

export function buildRegenPrompt(
  section: keyof GeneratedDraft,
  guidance: string,
  currentValue: string | string[]
): string {
  const currentStr = Array.isArray(currentValue)
    ? JSON.stringify(currentValue, null, 2)
    : typeof currentValue === "string"
      ? currentValue
      : JSON.stringify(currentValue, null, 2);

  return `Regenerate ONLY the "${section}" section of the LinkedIn profile.

Current version:
${currentStr}

User's guidance for regeneration:
${guidance}

Return ONLY valid JSON with a single key "${section}" and the regenerated value. For skills, return a string array. For experience, return an array of objects with {title, company, duration_months, description, is_current}. For headline/about, return a string.`;
}
