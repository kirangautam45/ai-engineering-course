// Plain JavaScript functions that call free public APIs (no API key needed).
// Day 17 and Day 18 both use these.

// Weather from Open-Meteo: https://open-meteo.com
export async function getWeather({ city }) {
  const geo = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
  ).then((r) => r.json());
  const place = geo.results?.[0];
  if (!place) throw new Error(`No city called "${city}" was found. Check the spelling.`);

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto`;
  const { current } = await fetch(url).then((r) => r.json());

  // Return only what the model needs, in a compact form. Every character costs tokens.
  return JSON.stringify({
    place: `${place.name}, ${place.country}`,
    temperature_c: current.temperature_2m,
    humidity_percent: current.relative_humidity_2m,
    precipitation_mm: current.precipitation,
    wind_kmh: current.wind_speed_10m,
    local_time: current.time,
  });
}

// Exchange rates from ExchangeRate-API's free endpoint: https://www.exchangerate-api.com/docs/free
export async function convertCurrency({ amount, from, to }) {
  from = from.toUpperCase();
  to = to.toUpperCase();
  const data = await fetch(`https://open.er-api.com/v6/latest/${from}`).then((r) => r.json());
  if (data.result !== "success") throw new Error(`Unknown currency code "${from}". Use codes like USD, NPR, INR.`);

  const rate = data.rates[to];
  if (!rate) throw new Error(`Unknown currency code "${to}". Use codes like USD, NPR, INR.`);

  return JSON.stringify({
    amount,
    from,
    to,
    rate,
    converted: Math.round(amount * rate * 100) / 100,
    rates_updated: data.time_last_update_utc,
  });
}
