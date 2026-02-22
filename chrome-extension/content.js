/**
 * LinkedIn Profile Optimizer - Content Script
 *
 * Scrapes a LinkedIn profile page and sends structured data to the optimizer web app.
 * Uses multiple selector strategies with fallbacks for resilience against DOM changes.
 *
 * Runs on: https://www.linkedin.com/in/*
 */

const OPTIMIZER_URL = "https://linkedin-optimizer-web.vercel.app";

// ---------------------------------------------------------------------------
// Inject floating action button
// ---------------------------------------------------------------------------

function injectButton() {
  if (document.getElementById("li-optimizer-btn")) return;

  const btn = document.createElement("button");
  btn.id = "li-optimizer-btn";

  // Build button content safely using DOM APIs
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute("d", "M12 20V10");
  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute("d", "M18 20V4");
  const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path3.setAttribute("d", "M6 20v-4");
  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);

  const span = document.createElement("span");
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
  const btn = document.getElementById("li-optimizer-btn");
  if (btn) {
    btn.classList.add("li-optimizer-loading");
    const span = btn.querySelector("span");
    if (span) span.textContent = "Scraping...";
  }

  try {
    // First, expand all "see more" sections so we capture full text
    await expandAllSections();

    // Small delay to let DOM settle after expansions
    await sleep(500);

    const profile = scrapeProfile();

    // Encode as base64 in URL fragment (never sent to server)
    const json = JSON.stringify(profile);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    const url = OPTIMIZER_URL + "?import=extension#data=" + encoded;

    window.open(url, "_blank");

    if (btn) {
      btn.classList.remove("li-optimizer-loading");
      const span = btn.querySelector("span");
      if (span) span.textContent = "Analyze Profile";
    }
  } catch (err) {
    console.error("[LinkedIn Optimizer] Scrape failed:", err);
    if (btn) {
      btn.classList.remove("li-optimizer-loading");
      const span = btn.querySelector("span");
      if (span) span.textContent = "Error - Retry";
    }
    alert(
      "LinkedIn Optimizer: Failed to scrape profile.\n\n" +
        "LinkedIn may have changed their page structure. " +
        "Please report this issue.\n\n" +
        "Error: " +
        err.message
    );
  }
}

// ---------------------------------------------------------------------------
// Section expanders - click all "see more" / "show all" buttons
// ---------------------------------------------------------------------------

async function expandAllSections() {
  // Expand the About section "see more"
  const aboutMore = findElement([
    '#about ~ .display-flex button[aria-expanded="false"]',
    '#about + div + div button.inline-show-more-text__button',
    'section:has(#about) button.inline-show-more-text__button',
    '#about ~ div button.inline-show-more-text__button',
  ]);
  if (aboutMore) {
    aboutMore.click();
    await sleep(300);
  }

  // Expand experience descriptions
  const expMoreButtons = document.querySelectorAll(
    '#experience ~ div button.inline-show-more-text__button, ' +
    'section:has(#experience) button.inline-show-more-text__button'
  );
  for (const expandBtn of expMoreButtons) {
    expandBtn.click();
    await sleep(100);
  }

  // Scroll down to load lazy sections (skills, education)
  const sections = ["#skills", "#education", "#recommendations"];
  for (const sel of sections) {
    const el = document.querySelector(sel);
    if (el) {
      el.scrollIntoView({ behavior: "instant", block: "center" });
      await sleep(300);
    }
  }

  // Scroll back to top
  window.scrollTo({ top: 0, behavior: "instant" });
  await sleep(200);
}

// ---------------------------------------------------------------------------
// Core scraper
// ---------------------------------------------------------------------------

function scrapeProfile() {
  return {
    name: scrapeName(),
    headline: scrapeHeadline(),
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
    open_to_work_private: false, // Not detectable from public view
    posts_per_month: 0, // Would require Activity tab scrape
    comments_per_week: 0, // Would require Activity tab scrape
  };
}

// ---------------------------------------------------------------------------
// Individual field scrapers
// ---------------------------------------------------------------------------

function scrapeName() {
  const el = findElement([
    "h1.text-heading-xlarge",
    ".pv-top-card--list h1",
    "main section:first-child h1",
    "h1",
  ]);
  return el ? el.textContent.trim() : "";
}

function scrapeHeadline() {
  const el = findElement([
    ".text-body-medium.break-words",
    ".pv-top-card--list .text-body-medium",
    "main section:first-child .text-body-medium",
    "h1 + .text-body-medium",
  ]);
  return el ? el.textContent.trim() : "";
}

function scrapeAbout() {
  // Strategy 1: Find the #about section and get text from sibling containers
  const aboutSection = document.querySelector("#about");
  if (aboutSection) {
    // The text is typically in a span within the section that contains #about
    const section = aboutSection.closest("section");
    if (section) {
      const textEl = findElement(
        [
          '.inline-show-more-text span[aria-hidden="true"]',
          ".inline-show-more-text span.visually-hidden + span",
          ".inline-show-more-text",
          'div.display-flex span[aria-hidden="true"]',
          "span.visually-hidden + span",
        ],
        section
      );

      if (textEl) return textEl.textContent.trim();

      // Fallback: get all visible text in the section minus the heading
      const allText = section.textContent.trim();
      const heading = section.querySelector("h2, .pvs-header__title");
      const headingText = heading ? heading.textContent.trim() : "About";
      return allText.replace(headingText, "").trim();
    }
  }
  return "";
}

function scrapeExperience() {
  const entries = [];
  const expSection = document.querySelector("#experience");
  if (!expSection) return entries;

  const section = expSection.closest("section");
  if (!section) return entries;

  // LinkedIn has two experience layouts:
  // 1. Single role per company: li > div with title, company, duration, description
  // 2. Multiple roles per company: li > div with company header, then nested roles

  const items = section.querySelectorAll(":scope > div > div > div > ul > li");

  for (const item of items) {
    // Check if this is a grouped company (multiple roles)
    const nestedRoles = item.querySelectorAll(
      ":scope > div > div > div > ul > li"
    );

    if (nestedRoles.length > 0) {
      // Grouped: extract company name from the parent, then each role
      const companyEl = item.querySelector(
        'a > div > div > div > div > span[aria-hidden="true"], ' +
          'div > div > div > a > div > span[aria-hidden="true"]'
      );
      const company = companyEl ? companyEl.textContent.trim() : "";

      for (const role of nestedRoles) {
        entries.push(parseExperienceItem(role, company));
      }
    } else {
      // Single role
      entries.push(parseExperienceItem(item));
    }
  }

  return entries.filter(function (e) {
    return e.title || e.company;
  });
}

function parseExperienceItem(el, parentCompany) {
  // Get all visible text spans (LinkedIn uses aria-hidden="true" for the visible version)
  const visibleSpans = el.querySelectorAll('span[aria-hidden="true"]');
  const texts = Array.from(visibleSpans).map(function (s) {
    return s.textContent.trim();
  });

  // Typical order: [title, company/type, date range, location, description...]
  // For nested roles: [title, date range, location, description...]
  var title = "";
  var company = parentCompany || "";
  var durationText = "";
  var description = "";

  if (parentCompany) {
    // Nested role: title is first, then dates
    title = texts[0] || "";
    durationText = texts[1] || "";
  } else {
    title = texts[0] || "";
    company = texts[1] || "";
    durationText = texts[2] || "";
  }

  // Try to find description in a show-more or plain text area
  var descEl = el.querySelector(
    '.inline-show-more-text span[aria-hidden="true"], ' +
      ".pvs-list__outer-container .inline-show-more-text, " +
      "ul .inline-show-more-text"
  );
  if (descEl) {
    description = descEl.textContent.trim();
  }

  // Parse duration from text like "Jan 2024 - Present · 1 yr 6 mos"
  var durationMonths = parseDurationMonths(durationText);
  var captionEl = el.querySelector(".pvs-entity__caption-wrapper");
  var isCurrent =
    durationText.toLowerCase().indexOf("present") !== -1 ||
    (captionEl &&
      captionEl.textContent.toLowerCase().indexOf("present") !== -1) ||
    false;

  // Clean company - remove employment type suffix
  company = company
    .replace(
      /\s*·\s*(Full-time|Part-time|Contract|Freelance|Internship|Self-employed).*$/i,
      ""
    )
    .trim();

  return {
    title: title,
    company: company,
    duration_months: durationMonths,
    description: description,
    is_current: isCurrent,
  };
}

function scrapeSkills() {
  var skills = [];
  var skillsSection = document.querySelector("#skills");
  if (!skillsSection) return skills;

  var section = skillsSection.closest("section");
  if (!section) return skills;

  // Skills are in list items with the skill name in a visible span
  var items = section.querySelectorAll("li");
  for (var i = 0; i < items.length; i++) {
    var nameEl = items[i].querySelector(
      'div > div > div > div > a > div > div > div > span[aria-hidden="true"], ' +
        'span[aria-hidden="true"]'
    );
    if (nameEl) {
      var name = nameEl.textContent.trim();
      if (name && skills.indexOf(name) === -1 && name.length < 100) {
        skills.push(name);
      }
    }
  }

  return skills;
}

function scrapeEducation() {
  var education = [];
  var eduSection = document.querySelector("#education");
  if (!eduSection) return education;

  var section = eduSection.closest("section");
  if (!section) return education;

  var items = section.querySelectorAll(":scope > div > div > div > ul > li");
  for (var i = 0; i < items.length; i++) {
    var spans = items[i].querySelectorAll('span[aria-hidden="true"]');
    var texts = Array.from(spans).map(function (s) {
      return s.textContent.trim();
    });
    // Typically: [school name, degree/field, dates]
    if (texts.length > 0) {
      var parts = texts.slice(0, 2).filter(Boolean);
      education.push(parts.join(", "));
    }
  }

  return education;
}

function scrapeFeaturedCount() {
  var featuredSection = document.querySelector("#featured");
  if (!featuredSection) return 0;

  var section = featuredSection.closest("section");
  if (!section) return 0;

  var items = section.querySelectorAll("li");
  return items.length;
}

function scrapeRecommendationsCount() {
  var recSection = document.querySelector("#recommendations");
  if (!recSection) return 0;

  var section = recSection.closest("section");
  if (!section) return 0;

  // Look for tab button text like "Received (5)"
  var tabs = section.querySelectorAll('button[role="tab"]');
  for (var i = 0; i < tabs.length; i++) {
    var text = tabs[i].textContent.trim();
    var match = text.match(/Received\s*\((\d+)\)/i);
    if (match) return parseInt(match[1], 10);
  }

  // Fallback: count visible recommendation items
  var items = section.querySelectorAll("li");
  return items.length;
}

function scrapeConnectionsCount() {
  // Look for "XXX connections" or "500+ connections" text
  var el = findElement([
    'a[href*="/connections"] span',
    ".pv-top-card--list-bullet a span",
    "span.t-bold",
  ]);

  if (el) {
    var text = el.textContent.trim();
    var match = text.match(/(\d[\d,]*)\+?\s*(connections|followers)?/i);
    if (match) {
      var num = parseInt(match[1].replace(/,/g, ""), 10);
      return isNaN(num) ? 0 : num;
    }
  }

  // Broader search for connection count anywhere in top card
  var topCard = document.querySelector("main section:first-child");
  if (topCard) {
    var allText = topCard.textContent;
    var broadMatch = allText.match(/(\d[\d,]*)\+?\s*connections/i);
    if (broadMatch) {
      return parseInt(broadMatch[1].replace(/,/g, ""), 10);
    }
  }

  return 0;
}

function scrapeHasPhoto() {
  var photo = findElement([
    "img.pv-top-card-profile-picture__image",
    'main section:first-child img[src*="profile-displayphoto"]',
    "main section:first-child img.evi-image",
    'img[alt*="photo"]',
  ]);
  return !!photo;
}

function scrapeHasBanner() {
  var banner = findElement([
    ".profile-background-image img",
    "main section:first-child .live-video-hero-image img",
    'img[class*="banner"]',
    ".profile-topcard-background-image img",
  ]);
  // Also check for background-image CSS
  var topSection = document.querySelector(
    ".profile-background-image, .live-video-hero-image"
  );
  if (topSection) {
    var bg = window.getComputedStyle(topSection).backgroundImage;
    if (bg && bg !== "none") return true;
  }
  return !!banner;
}

function scrapeHasCustomUrl() {
  // Custom URLs look like linkedin.com/in/thiagorocha
  // Default URLs look like linkedin.com/in/thiago-rocha-a1b2c3d4
  var path = window.location.pathname.replace(/\/$/, "");
  var slug = path.split("/").pop() || "";
  // Default URLs have a hex suffix after a dash
  var isDefault = /^.+-[a-f0-9]{6,}$/i.test(slug);
  return !isDefault;
}

function scrapeHasVerification() {
  var badge = findElement([
    'svg[data-test-icon="verified-medium"]',
    ".pv-top-card__verification-badge",
    '[aria-label*="verified"]',
    '[aria-label*="Verified"]',
    'li-icon[type="verified"]',
  ]);
  return !!badge;
}

function scrapeOpenToWork() {
  // Look for the green "Open to work" frame/badge
  var badge = findElement([
    "span.pv-open-to-carousel-card",
    '[aria-label*="Open to work"]',
    'div[class*="open-to-work"]',
    'img[alt*="Open to work"]',
  ]);

  // Also check for text content
  var topCard = document.querySelector("main section:first-child");
  if (topCard && topCard.textContent.indexOf("Open to work") !== -1)
    return true;

  return !!badge;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function findElement(selectors, root) {
  var parent = root || document;
  for (var i = 0; i < selectors.length; i++) {
    try {
      var el = parent.querySelector(selectors[i]);
      if (el) return el;
    } catch (e) {
      // Invalid selector, skip
    }
  }
  return null;
}

function parseDurationMonths(text) {
  if (!text) return 0;

  // Match patterns like "1 yr 6 mos", "2 yrs", "8 mos", "1 yr"
  var yrMatch = text.match(/(\d+)\s*yr/i);
  var moMatch = text.match(/(\d+)\s*mo/i);

  var months = 0;
  if (yrMatch) months += parseInt(yrMatch[1], 10) * 12;
  if (moMatch) months += parseInt(moMatch[1], 10);

  // If no match, try "Month Year - Month Year" format
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

// Wait for page to be reasonably loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectButton);
} else {
  injectButton();
}

// Re-inject if SPA navigation changes the page
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
