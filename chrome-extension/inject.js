/**
 * LinkedIn Profile Optimizer - Inject Script
 *
 * Runs on the optimizer web app (linkedin-optimizer-web.vercel.app).
 * Reads scraped profile data from chrome.storage.local and passes it
 * to the React app via window.postMessage.
 */

(function () {
  // Only act when opened via extension import
  if (window.location.search.indexOf("import=extension") === -1) return;

  console.log("[LinkedIn Optimizer Inject] Checking chrome.storage for profile data...");

  chrome.storage.local.get("li-optimizer-profile", function (result) {
    var profile = result["li-optimizer-profile"];
    if (!profile) {
      console.log("[LinkedIn Optimizer Inject] No profile data found in storage.");
      return;
    }

    console.log("[LinkedIn Optimizer Inject] Found profile:", profile.name);

    // Post to the page's JS context (React app listens for this)
    window.postMessage(
      { type: "linkedin-optimizer-import", profile: profile },
      "*"
    );

    // Clear storage so it doesn't re-import on refresh
    chrome.storage.local.remove("li-optimizer-profile", function () {
      console.log("[LinkedIn Optimizer Inject] Cleared storage after import.");
    });
  });
})();
