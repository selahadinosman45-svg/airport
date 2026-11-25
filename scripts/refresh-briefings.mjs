import fs from 'node:fs/promises';

// GitHub Actions fetches public METAR/TAF only. No paid NOTAM provider or API keys.
const source = await fs.readFile(new URL('../data.js', import.meta.url), 'utf8');
const airports = [...new Set([...source.matchAll(/"icao"\s*:\s*"([A-Z0-9]{4})"/g)].map(m => m[1]))];
const output = { generatedAt: new Date().toISOString(), refreshIntervalMinutes: 15, airports: {} };

for (const icao of airports) {
  const entry = { icao, weather: { metar: '', taf: '' }, fetchedAt: new Date().toISOString(), errors: [] };
  try {
    const [metarResponse, tafResponse] = await Promise.all([
      fetch(`https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao)}&format=raw&hours=2`),
      fetch(`https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(icao)}&format=raw`)
    ]);
    if (!metarResponse.ok) throw new Error(`METAR HTTP ${metarResponse.status}`);
    if (!tafResponse.ok) throw new Error(`TAF HTTP ${tafResponse.status}`);
    entry.weather.metar = (await metarResponse.text()).trim();
    entry.weather.taf = (await tafResponse.text()).trim();
  } catch (error) {
    entry.errors.push(`Weather: ${error.message}`);
  }
  output.airports[icao] = entry;
}

await fs.writeFile(new URL('../live-briefings.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote public METAR/TAF snapshots for ${airports.length} airports`);
