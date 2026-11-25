# Airport Briefings — GitHub Pages weather-only edition

This edition removes the NOTAM section, NOTAM provider integration, and all Gemini/AI translation or explanation controls. No NOTAM API key or Gemini API key is required.

## Weather briefings

GitHub Actions retrieves publicly available METAR and TAF reports from the Aviation Weather Center for the airports listed in `data.js`. It runs every 15 minutes and can also be started manually from **Actions → Refresh airport weather briefings → Run workflow**. The generated `live-briefings.json` is published with the GitHub Pages site. The airport page displays the raw METAR/TAF and the last refresh time.

## GitHub Pages setup

1. Upload the contents of this folder to the repository that publishes the website.
2. In **Settings → Actions → General → Workflow permissions**, enable **Read and write permissions** so the workflow can commit the refreshed weather snapshot.
3. Ensure GitHub Pages publishes from the branch/folder containing `index.html`.
4. Run **Actions → Refresh airport weather briefings → Run workflow** once to create the initial `live-briefings.json`.

No repository secrets are needed. GitHub Pages is static hosting, so weather is published as a scheduled snapshot and may be delayed by Actions queue/runtime time. METAR/TAF availability depends on upstream coverage for each airport. Always consult official operational sources and current approved documentation.
