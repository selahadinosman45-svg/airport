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

## Domestic briefing cards and escape-route reference

- Domestic Briefing airports are shown individually and now use a structured, rounded briefing card rather than the generic SOURCE / RWY placeholder tiles.
- Each domestic card is populated from the supplied *Airport Information* PDF dated 09 September 2024, with runway/minima, MSA/MAP/frequencies, elevation data, route procedures and depressurization escape-route text grouped into readable panels.
- Every international airport page retains an Escape Routes pop-up. Where a complete airport-specific escape route exists in the supplied records, it is shown. Where only an exit point is available, the pop-up identifies that exit point and explicitly states that the full route was not supplied; no route is invented from an exit fix alone.
- Buttons use the original soft, rounded neutral styling in light and dark themes.
- All source procedures are historical operational references and must be checked against current approved charts and company documentation before use.

## Exit-point escape routes

Airport escape-route pop-ups now include the user-supplied procedures for KONET, TORBA/LAKBE, ALEMU, RUDOL, EKBUL, DAGAP, BRO and ALRAP. Routes are assigned to airport destinations using the recorded EXIT point (including LAKBE→TORBA and MVA→MAV aliases). ARSHI→ASOLE and MAV→ALEMU are shown only as supplied exit-point references because no further routing was provided. EGBIM is likewise identified as an exit point without inventing a route. These are historical/user-supplied operational references and must be checked against current approved company procedures and charts.
