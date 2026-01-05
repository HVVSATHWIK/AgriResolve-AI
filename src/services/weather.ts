export type CurrentWeather = {
  temperatureC?: number;
  humidityPercent?: number;
  precipitationMm?: number;
  windSpeedKph?: number;
  weatherCode?: number;
  observedAt?: string;
  timezone?: string;
};

export async function fetchCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeather | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', [
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation',
    'weather_code',
    'wind_speed_10m'
  ].join(','));
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'accept': 'application/json' },
  });

  if (!response.ok) return null;

  const json = await response.json();
  const current = json?.current;
  if (!current) return null;

  return {
    temperatureC: typeof current.temperature_2m === 'number' ? current.temperature_2m : undefined,
    humidityPercent: typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : undefined,
    precipitationMm: typeof current.precipitation === 'number' ? current.precipitation : undefined,
    windSpeedKph: typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : undefined,
    weatherCode: typeof current.weather_code === 'number' ? current.weather_code : undefined,
    observedAt: typeof current.time === 'string' ? current.time : undefined,
    timezone: typeof json.timezone === 'string' ? json.timezone : undefined,
  };
}
