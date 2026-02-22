# LinkedIn Profile Optimizer - Chrome Extension

One-click LinkedIn profile analysis. Visit any LinkedIn profile, click "Analyze Profile", and get an instant score with recommendations.

## Install (takes 30 seconds)

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select this `chrome-extension` folder
5. Done! You'll see the extension icon in your toolbar

## How to Use

1. Go to any LinkedIn profile page (yours or someone else's)
2. Click the blue **Analyze Profile** button (bottom-right corner of the page)
3. The optimizer opens in a new tab with all profile data pre-filled
4. Pick a target role and see your score instantly

## What Gets Captured Automatically

- Name, headline, about section
- All experience entries (title, company, duration, description)
- Skills list
- Education
- Connection count, featured items, recommendations count
- Profile photo, banner, custom URL, verification status
- Open to Work status

## What You Set Manually (5 seconds)

- Posts per month (1 slider)
- Comments per week (1 slider)

These require visiting the Activity tab which the extension doesn't scrape.

## Privacy

All data stays in your browser. Nothing is sent to any server. The profile data is encoded in the URL fragment hash (the part after #) which is never sent to the web server.

## Troubleshooting

**Button doesn't appear?**
- Make sure you're on a profile page (URL starts with `linkedin.com/in/`)
- Try refreshing the page
- Check that the extension is enabled in `chrome://extensions`

**Data looks wrong or incomplete?**
- LinkedIn may have changed their page structure
- Try scrolling through the full profile first, then click Analyze
- Report the issue so we can update the selectors
