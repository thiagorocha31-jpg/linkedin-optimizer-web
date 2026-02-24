/**
 * LinkedIn Profile Optimizer - Content Script (v2)
 *
 * Scrapes a LinkedIn profile page and sends structured data to the optimizer.
 * Uses heading-based section discovery + text parsing (resilient to DOM changes).
 *
 * Runs on: https://www.linkedin.com/in/*
 */

var OPTIMIZER_URL = "https://linkedin-optimizer-web.vercel.app";

// ---------------------------------------------------------------------------
// Inject floating action button
// ---------------------------------------------------------------------------

function injectButton() {
  if (document.getElementById("li-optimizer-btn")) return;

  var btn = document.createElement("button");
  btn.id = "li-optimizer-btn";

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  var path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M12 20V10");
  var path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute("d", "M18 20V4");
  var path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path3.setAttribute("d", "M6 20v-4");
  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);

  var span = document.createElement("span");
  span.textContent = "Analyze Profile";

  btn.appendChild(svg);
  btn.appendChild(span);
  btn.addEventListener("click", handleAnalyze);
  document.body.appendChild(btn);
}

// ---------------------------------------------------------------------------
// Main scrape + navigate flow
// ---------------------------------------------------------------------------

async function handleAnalyze() {
  var btn = document.getElementById("li-optimizer-btn");
  if (btn) {
    btn.classList.add("li-optimizer-loading");
    var span = btn.querySelector("span");
    if (span) span.textContent = "Scraping...";
  }

  try {
    // Scroll through the page to load lazy sections
    await loadAllSections();

    var profile = scrapeProfile();

    console.log("[LinkedIn Optimizer] Scraped profile:", JSON.stringify(profile, null, 2));
    console.log("[LinkedIn Optimizer] Name:", profile.name);
    console.log("[LinkedIn Optimizer] Headline:", profile.headline);
    console.log("[LinkedIn Optimizer] Experience:", profile.experience.length, "entries");
    console.log("[LinkedIn Optimizer] Skills:", profile.skills.length, "skills");
    console.log("[LinkedIn Optimizer] Education:", profile.education.length, "entries");

    // Save to chrome.storage.local, then open optimizer
    chrome.storage.local.set({ "li-optimizer-profile": profile }, function () {
      console.log("[LinkedIn Optimizer] Profile saved to chrome.storage.local");
      window.open(OPTIMIZER_URL + "?import=extension", "_blank");
    });

    if (btn) {
      btn.classList.remove("li-optimizer-loading");
      var span2 = btn.querySelector("span");
      if (span2) span2.textContent = "Analyze Profile";
    }
  } catch (err) {
    console.error("[LinkedIn Optimizer] Scrape failed:", err);
    if (btn) {
      btn.classList.remove("li-optimizer-loading");
      var span3 = btn.querySelector("span");
      if (span3) span3.textContent = "Error - Retry";
    }
    alert(
      "LinkedIn Optimizer: Failed to scrape profile.\n\n" +
        "Error: " + err.message
    );
  }
}

// ---------------------------------------------------------------------------
// Scroll to load lazy sections
// ---------------------------------------------------------------------------

async function loadAllSections() {
  var scrollPositions = [1000, 3000, 5000, 8000, 12000];
  for (var i = 0; i < scrollPositions.length; i++) {
    window.scrollTo({ top: scrollPositions[i], behavior: "instant" });
    await sleep(400);
  }
  // Back to top
  window.scrollTo({ top: 0, behavior: "instant" });
  await sleep(300);
}

// ---------------------------------------------------------------------------
// Section finder - LinkedIn 2025 uses H2 headings, no IDs
// ---------------------------------------------------------------------------

function findSectionByHeading(heading) {
  var h2s = document.querySelectorAll("h2");
  for (var i = 0; i < h2s.length; i++) {
    if (h2s[i].textContent.trim() === heading) {
      return h2s[i].closest("section");
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Core scraper
// ---------------------------------------------------------------------------

function scrapeProfile() {
  var nameAndHeadline = scrapeNameAndHeadline();
  return {
    name: nameAndHeadline.name,
    headline: nameAndHeadline.headline,
    about: scrapeAbout(),
    experience: scrapeExperience(),
    skills: scrapeSkills(),
    education: scrapeEducation(),
    certifications: [],
    featured_items: scrapeFeaturedCount(),
    recommendations_count: scrapeRecommendationsCount(),
    connections_count: scrapeConnectionsCount(),
    has_profile_photo: scrapeHasPhoto(),
    has_banner: scrapeHasBanner(),
    has_custom_url: scrapeHasCustomUrl(),
    has_verification: scrapeHasVerification(),
    open_to_work: scrapeOpenToWork(),
    open_to_work_private: false,
    posts_per_month: 0,
    comments_per_week: 0,
  };
}

// ---------------------------------------------------------------------------
// Name + Headline from the profile card section
// ---------------------------------------------------------------------------

function scrapeNameAndHeadline() {
  var result = { name: "", headline: "" };

  // The profile card is in main, look for the first section with
  // an h2 that looks like a person's name
  var sections = document.querySelectorAll("main section");
  for (var i = 0; i < sections.length; i++) {
    var h2 = sections[i].querySelector("h2");
    if (!h2) continue;
    var text = h2.textContent.trim();
    // Skip known section headings
    if (/^(Activity|Experience|Education|Skills|Licenses|Recommendations|Languages|Interests|Featured|About|People|Explore|More|Sales|Ad\s)/.test(text)) continue;
    if (/notifications$/i.test(text)) continue;
    // Skip headings that are clearly not names
    if (text.length < 3 || /^\d/.test(text)) continue;

    result.name = text;

    // Headline is in a <p> tag
    var paragraphs = sections[i].querySelectorAll("p");
    for (var j = 0; j < paragraphs.length; j++) {
      var pText = paragraphs[j].textContent.trim();
      if (pText.length < 5) continue;
      if (/^(He\/Him|She\/Her|They\/Them)/i.test(pText)) continue;
      if (/connections|followers|mutual/i.test(pText)) continue;
      if (/Contact info/i.test(pText)) continue;
      if (/^\u00B7\s*(1st|2nd|3rd)/i.test(pText)) continue; // Skip connection degree
      if (/^(1st|2nd|3rd)$/i.test(pText)) continue;
      result.headline = pText;
      break;
    }
    break;
  }

  return result;
}

// ---------------------------------------------------------------------------
// About section
// ---------------------------------------------------------------------------

function scrapeAbout() {
  var section = findSectionByHeading("About");
  if (!section) return "";

  var text = section.textContent.trim();
  text = text.replace(/^About\s*/, "");
  text = text.replace(/\s*(\.\.\.see more|see less|Show less|Show more)$/i, "");
  return text.trim();
}

// ---------------------------------------------------------------------------
// Experience - parse from section text using date patterns
// ---------------------------------------------------------------------------

function scrapeExperience() {
  var section = findSectionByHeading("Experience");
  if (!section) return [];

  var text = section.textContent.trim();
  text = text.replace(/^Experience\s*/, "");
  text = text.replace(/\s*Show all\s*\d*\s*experiences?\s*$/i, "");

  // Split on date patterns: "Mon YYYY - Mon YYYY · Duration" or "Mon YYYY - Present · Duration"
  var monthNames = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
  var dateRangeRegex = new RegExp(
    "(" + monthNames + ")\\s+(\\d{4})\\s*[-\\u2013]\\s*((?:" + monthNames + ")\\s+\\d{4}|Present)\\s*\\u00B7?\\s*(\\d+\\s*(?:yr|mo|year|month)s?(?:\\s+\\d+\\s*(?:yr|mo|year|month)s?)?)?",
    "gi"
  );

  var entries = [];
  var matches = [];
  var match;

  while ((match = dateRangeRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      dateStr: match[0],
      isCurrent: /present/i.test(match[3]),
    });
  }

  for (var i = 0; i < matches.length; i++) {
    var m = matches[i];
    var startIdx = i > 0 ? matches[i - 1].index + matches[i - 1].length : 0;
    var beforeText = text.substring(startIdx, m.index).trim();

    // The text between two date ranges = [prev location] + [curr title+company]
    // Remove leading location (city, state, country at start of text)
    beforeText = beforeText.replace(/^[\w\s,.-]+(?:United States|Canada|United Kingdom|Australia|India|Germany|France|Brazil|Netherlands|Massachusetts|Illinois|California|New York|Texas|Virginia|Washington|Georgia|Oregon|Florida|Ohio|Colorado|Connecticut|Arizona|Pennsylvania)\s*/i, "");

    // Remove employment type
    beforeText = beforeText.replace(/\s*\u00B7\s*(Full-time|Part-time|Contract|Freelance|Internship|Self-employed|Seasonal).*$/i, "").trim();

    // Remove trailing duration like "2 yrs 8 mos"
    beforeText = beforeText.replace(/\s*\d+\s*(?:yr|mo|year|month)s?(?:\s+\d+\s*(?:yr|mo|year|month)s?)?\s*$/i, "").trim();

    var durationMonths = parseDurationMonths(m.dateStr);

    // Try splitting title from company
    var titleCompany = splitTitleCompany(beforeText);

    if (titleCompany.title || titleCompany.company) {
      entries.push({
        title: titleCompany.title,
        company: titleCompany.company,
        duration_months: durationMonths,
        description: "",
        is_current: m.isCurrent,
      });
    }
  }

  return entries;
}

function splitTitleCompany(text) {
  if (!text) return { title: "", company: "" };

  // If text is very short, it's probably just a title (nested role)
  if (text.length < 5) return { title: text, company: "" };

  // Try to detect where a company name starts by looking for patterns:
  // "Title at Company" or "TitleCompany" where Company starts with capital
  // Common: "ManagerBain & Company" or "Director of Product Development - SkincareSharkNinja"

  // Strategy: Look for the last occurrence of a transition from lowercase to uppercase
  // that could indicate a company name boundary
  var bestSplit = -1;

  for (var i = 1; i < text.length - 1; i++) {
    var prev = text[i - 1];
    var curr = text[i];
    // Transition from lowercase letter to uppercase letter (word boundary without space)
    if (/[a-z]/.test(prev) && /[A-Z]/.test(curr)) {
      // Check that what follows looks like a company name (at least 3 chars)
      var remaining = text.substring(i);
      if (remaining.length >= 3) {
        bestSplit = i;
        // Keep going to find the LAST such boundary that still leaves a reasonable company name
        // Actually, we want the one that produces the best-looking split
        // Heuristic: prefer splits where the company part is a known pattern
        break; // Take the first one - usually title comes first, then company
      }
    }
  }

  if (bestSplit > 0) {
    return {
      title: text.substring(0, bestSplit).trim(),
      company: text.substring(bestSplit).trim(),
    };
  }

  return { title: text, company: "" };
}

// ---------------------------------------------------------------------------
// Skills - parse from text, split on "Endorse"
// ---------------------------------------------------------------------------

function scrapeSkills() {
  var section = findSectionByHeading("Skills");
  if (!section) return [];

  var text = section.textContent.trim();
  text = text.replace(/^Skills\s*/, "");
  text = text.replace(/\s*Show all.*$/i, "");

  // Skills text: "Product MarketingEndorseProduct ManagementEndorse"
  var parts = text.split(/Endorse/);
  var skills = [];
  for (var i = 0; i < parts.length; i++) {
    var skill = parts[i].trim();
    if (skill && skill.length > 1 && skill.length < 80) {
      skills.push(skill);
    }
  }

  return skills;
}

// ---------------------------------------------------------------------------
// Education - parse from section text
// ---------------------------------------------------------------------------

function scrapeEducation() {
  var section = findSectionByHeading("Education");
  if (!section) return [];

  var text = section.textContent.trim();
  text = text.replace(/^Education\s*/, "");
  text = text.replace(/\s*Show all.*$/i, "");

  // Split on year ranges: "YYYY - YYYY" or "YYYY \u2013 YYYY"
  var parts = text.split(/(\d{4}\s*[\u2013\-]\s*\d{4})/);
  var entries = [];

  for (var i = 0; i < parts.length; i += 2) {
    var entry = parts[i].trim();
    if (entry && entry.length > 3) {
      var years = parts[i + 1] ? parts[i + 1].trim() : "";
      entries.push(entry + (years ? ", " + years : ""));
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Featured count
// ---------------------------------------------------------------------------

function scrapeFeaturedCount() {
  var section = findSectionByHeading("Featured");
  if (!section) return 0;
  var items = section.querySelectorAll("li, article");
  return items.length;
}

// ---------------------------------------------------------------------------
// Recommendations count
// ---------------------------------------------------------------------------

function scrapeRecommendationsCount() {
  var section = findSectionByHeading("Recommendations");
  if (!section) return 0;

  var text = section.textContent;
  var match = text.match(/Received\s*\((\d+)\)/i);
  if (match) return parseInt(match[1], 10);

  return 0;
}

// ---------------------------------------------------------------------------
// Connections/followers count
// ---------------------------------------------------------------------------

function scrapeConnectionsCount() {
  var main = document.querySelector("main");
  if (!main) return 0;

  var paragraphs = main.querySelectorAll("p");
  for (var i = 0; i < paragraphs.length; i++) {
    var text = paragraphs[i].textContent.trim();
    var match = text.match(/^(\d[\d,]*)\+?\s*(connections|followers)/i);
    if (match) {
      return parseInt(match[1].replace(/,/g, ""), 10);
    }
  }

  var allText = main.textContent;
  var broadMatch = allText.match(/(\d[\d,]*)\+?\s*connections/i);
  if (broadMatch) return parseInt(broadMatch[1].replace(/,/g, ""), 10);

  var followerMatch = allText.match(/(\d[\d,]*)\s*followers/i);
  if (followerMatch) return parseInt(followerMatch[1].replace(/,/g, ""), 10);

  return 0;
}

// ---------------------------------------------------------------------------
// Profile photo
// ---------------------------------------------------------------------------

function scrapeHasPhoto() {
  var photoBtn = document.querySelector('button[aria-label*="Profile photo"], button[aria-label*="profile photo"]');
  if (photoBtn) return true;
  var imgs = document.querySelectorAll("main img");
  for (var i = 0; i < imgs.length; i++) {
    var src = imgs[i].src || "";
    if (/profile-displayphoto/i.test(src)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Banner image
// ---------------------------------------------------------------------------

function scrapeHasBanner() {
  var coverBtn = document.querySelector('button[aria-label*="Cover photo"], button[aria-label*="cover photo"]');
  return !!coverBtn;
}

// ---------------------------------------------------------------------------
// Custom URL
// ---------------------------------------------------------------------------

function scrapeHasCustomUrl() {
  var path = window.location.pathname.replace(/\/$/, "");
  var slug = path.split("/").pop() || "";
  return !/^.+-[a-f0-9]{6,}$/i.test(slug);
}

// ---------------------------------------------------------------------------
// Verification badge
// ---------------------------------------------------------------------------

function scrapeHasVerification() {
  var main = document.querySelector("main");
  if (!main) return false;
  return main.querySelectorAll('[aria-label*="verified"], [aria-label*="Verified"]').length > 0;
}

// ---------------------------------------------------------------------------
// Open to Work
// ---------------------------------------------------------------------------

function scrapeOpenToWork() {
  var main = document.querySelector("main");
  if (!main) return false;
  return /Open to work/i.test(main.textContent);
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function parseDurationMonths(text) {
  if (!text) return 0;

  var yrMatch = text.match(/(\d+)\s*yr/i);
  var moMatch = text.match(/(\d+)\s*mo/i);

  var months = 0;
  if (yrMatch) months += parseInt(yrMatch[1], 10) * 12;
  if (moMatch) months += parseInt(moMatch[1], 10);

  if (months === 0) {
    var dateMatch = text.match(
      /(\w+\s+\d{4})\s*[-\u2013]\s*(\w+\s+\d{4}|Present)/i
    );
    if (dateMatch) {
      var start = new Date(dateMatch[1]);
      var end =
        dateMatch[2].toLowerCase() === "present"
          ? new Date()
          : new Date(dateMatch[2]);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        months = Math.max(
          1,
          Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44))
        );
      }
    }
  }

  return months;
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectButton);
} else {
  injectButton();
}

// Re-inject on SPA navigation
var lastUrl = location.href;
var observer = new MutationObserver(function () {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (location.pathname.startsWith("/in/")) {
      setTimeout(injectButton, 1000);
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
