"""Plain Python functions that call free public APIs (no API key needed).

Day 17 and Day 18 both use these.
"""

import json

import httpx

TIMEOUT = 10  # seconds: never let a slow API hang the whole conversation


def fetch_json(url: str, **params) -> dict:
    """GET a URL and return its JSON, turning any failure into a clear error message for the model."""
    try:
        response = httpx.get(url, params=params, timeout=TIMEOUT)
        response.raise_for_status()  # 4xx/5xx → error
        return response.json()
    except httpx.HTTPError as error:
        raise ValueError(f"The service at {url.split('/')[2]} failed: {error}. Try again later.") from error


def get_weather(city: str) -> str:
    """Weather from Open-Meteo: https://open-meteo.com"""
    geo = fetch_json("https://geocoding-api.open-meteo.com/v1/search", name=city, count=1)
    places = geo.get("results") or []
    if not places:
        raise ValueError(f'No city called "{city}" was found. Check the spelling.')
    place = places[0]

    forecast = fetch_json(
        "https://api.open-meteo.com/v1/forecast",
        latitude=place["latitude"],
        longitude=place["longitude"],
        current="temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        timezone="auto",
    )
    if "current" not in forecast:
        raise ValueError(f"The weather service didn't return current conditions for {city}. Try again later.")
    current = forecast["current"]

    # Return only what the model needs, in a compact form. Every character costs tokens.
    return json.dumps({
        "place": f"{place['name']}, {place['country']}",
        "temperature_c": current["temperature_2m"],
        "humidity_percent": current["relative_humidity_2m"],
        "precipitation_mm": current["precipitation"],
        "wind_kmh": current["wind_speed_10m"],
        "local_time": current["time"],
    })


def convert_currency(amount: float, from_currency: str, to_currency: str) -> str:
    """Exchange rates from ExchangeRate-API's free endpoint: https://www.exchangerate-api.com/docs/free"""
    from_currency, to_currency = from_currency.upper(), to_currency.upper()
    data = fetch_json(f"https://open.er-api.com/v6/latest/{from_currency}")
    if data.get("result") != "success":
        raise ValueError(f'Unknown currency code "{from_currency}". Use codes like USD, NPR, INR.')

    rate = data["rates"].get(to_currency)
    if rate is None:
        raise ValueError(f'Unknown currency code "{to_currency}". Use codes like USD, NPR, INR.')

    return json.dumps({
        "amount": amount,
        "from": from_currency,
        "to": to_currency,
        "rate": rate,
        "converted": round(amount * rate, 2),
        "rates_updated": data["time_last_update_utc"],
    })
