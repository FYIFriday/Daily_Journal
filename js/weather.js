// Weather + location metadata, no API key required.
//   - Geolocation from the browser (requires user permission).
//   - Current weather from Open-Meteo (free, no key, CORS-friendly).
//   - City label from BigDataCloud reverse geocode (free, no key).
//
// Returns null gracefully if permission is denied or offline.

const WMO = {
  0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  77: 'Snow grains', 80: 'Light showers', 81: 'Showers', 82: 'Violent showers',
  85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

export function weatherEmoji(code) {
  if (code == null) return '📍';
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('No geolocation'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

// Fetch weather + location. Returns { location, weather } or null.
export async function fetchContext() {
  let pos;
  try { pos = await getPosition(); }
  catch { return null; }

  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  const out = { location: { lat, lon, label: '' }, weather: null };

  // Reverse geocode (best-effort).
  try {
    const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (r.ok) {
      const g = await r.json();
      out.location.label = [g.city || g.locality, g.principalSubdivisionCode?.split('-')?.pop() || g.countryCode]
        .filter(Boolean).join(', ');
    }
  } catch { /* ignore */ }
  if (!out.location.label) out.location.label = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

  // Current weather (best-effort).
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius`);
    if (r.ok) {
      const w = await r.json();
      const tempC = w?.current?.temperature_2m;
      const code = w?.current?.weather_code;
      if (tempC != null) {
        out.weather = {
          tempC: Math.round(tempC),
          tempF: Math.round(tempC * 9 / 5 + 32),
          code,
          text: WMO[code] || 'Weather',
        };
      }
    }
  } catch { /* ignore */ }

  return out;
}
