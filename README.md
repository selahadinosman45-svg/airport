# Airport Briefings
Static site, no build step. GitHub Pages: Settings > Pages > Deploy from branch > main / root.
Weather: live METAR/TAF fetched in the browser from aviationweather.gov (no key). Pins, recents and route progress are stored in localStorage.


## Update: Domestic and regional airport briefings

- Added a dedicated **Domestic Briefing** library with 21 Ethiopian airports from the supplied *Airport Information* PDF (dated 09 September 2024).
- Each airport has separate **SID / Departure**, **Escape Routes**, and **Full briefing sheet** pop-ups.
- Added Dubai International (DXB / OMDB) with arrival/departure frequency sequences, crew notes, and the supplied route references.
- Added Yaoundé Nsimalen (NSI / FKYS) from the supplied crew notes.
- Added/updated regional airport sheets for Bosaso (BSA), Wau (WUU), Garowe (GGR), Hargeisa (HGA), and Entebbe (EBB).
- Removed a duplicate BLZ entry and grouped the navigation library consistently.

**Operational data notice:** The supplied domestic airport PDF is dated 09 September 2024. Crew notes may be older or conflict with each other. This site is a reference aid, not an approved source of current operational information. Always verify current AIP/Jeppesen charts, NOTAMs, ATIS, clearances, and company procedures before flight.
