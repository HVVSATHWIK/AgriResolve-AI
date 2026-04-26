import { logger } from '../utils/logger.js';
import type { RainfallLevel } from './seedDecisionEngine.js';

export interface DerivedWeatherContext {
  locationInput: string;
  resolvedLocation: string;
  latitude: number;
  longitude: number;
  expectedTempAvg: number;
  expectedRainfall: RainfallLevel;
  rainfallBucket: RainfallLevel;
  rainfallMm14d: number;
  weatherConfidence: number;
  source: 'open-meteo';
  warnings: string[];
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  name?: string;
  admin1?: string;
  country?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastDailyResponse {
  time?: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
}

interface OpenMeteoForecastResponse {
  daily?: ForecastDailyResponse;
}

const DEFAULT_FORECAST_DAYS = 14;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeLocation(location: string): string {
  return location.trim().replace(/\s+/g, ' ');
}

function bucketizeRainfall(totalMm: number): RainfallLevel {
  if (totalMm < 5) {
    return 'low';
  }

  if (totalMm <= 20) {
    return 'moderate';
  }

  return 'high';
}

export function bucketizeRainfallMm(totalMm: number): RainfallLevel {
  return bucketizeRainfall(totalMm);
}

function computeAverageTemperature(daily: ForecastDailyResponse, dayCount: number): number | null {
  if (!daily.temperature_2m_max || !daily.temperature_2m_min) {
    return null;
  }

  const count = Math.min(
    dayCount,
    daily.temperature_2m_max.length,
    daily.temperature_2m_min.length
  );

  if (count <= 0) {
    return null;
  }

  let total = 0;
  for (let index = 0; index < count; index++) {
    const dayMax = daily.temperature_2m_max[index];
    const dayMin = daily.temperature_2m_min[index];

    if (!Number.isFinite(dayMax) || !Number.isFinite(dayMin)) {
      return null;
    }

    total += (dayMax + dayMin) / 2;
  }

  return total / count;
}

function computeRainfallTotal(daily: ForecastDailyResponse, dayCount: number): number | null {
  if (!daily.precipitation_sum) {
    return null;
  }

  const count = Math.min(dayCount, daily.precipitation_sum.length);
  if (count <= 0) {
    return null;
  }

  let total = 0;
  for (let index = 0; index < count; index++) {
    const precipitation = daily.precipitation_sum[index];
    if (!Number.isFinite(precipitation)) {
      return null;
    }

    total += Math.max(0, precipitation);
  }

  return total;
}

async function geocodeLocation(location: string): Promise<GeocodingResult | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', location);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    logger.warn('Weather geocoding request failed', { location, status: response.status });
    return null;
  }

  const json = (await response.json()) as GeocodingResponse;
  const result = json.results?.[0];

  if (!result || !Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
    return null;
  }

  return result;
}

async function fetchForecast(latitude: number, longitude: number, forecastDays: number): Promise<ForecastDailyResponse | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('daily', ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'].join(','));
  url.searchParams.set('forecast_days', String(forecastDays));
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    logger.warn('Weather forecast request failed', { latitude, longitude, status: response.status });
    return null;
  }

  const json = (await response.json()) as OpenMeteoForecastResponse;
  const daily = json.daily;

  if (!daily?.temperature_2m_max || !daily.temperature_2m_min || !daily.precipitation_sum) {
    return null;
  }

  return daily;
}

function calculateWeatherConfidence(params: {
  location: string;
  resolvedLocation: string;
  dayCount: number;
  requestedDays: number;
}): number {
  let confidence = 100;

  if (params.location.length < 3) {
    confidence -= 30;
  }

  if (!params.resolvedLocation || params.resolvedLocation === params.location) {
    confidence -= 10;
  }

  if (params.dayCount < params.requestedDays) {
    confidence -= Math.min(30, (params.requestedDays - params.dayCount) * 3);
  }

  return clamp(confidence, 40, 100);
}

export async function resolveWeatherForLocation(
  location: string,
  options?: { forecastDays?: number }
): Promise<DerivedWeatherContext | null> {
  const normalizedLocation = normalizeLocation(location);
  if (!normalizedLocation) {
    return null;
  }

  const forecastDays = options?.forecastDays ?? DEFAULT_FORECAST_DAYS;
  const geocoded = await geocodeLocation(normalizedLocation);
  if (!geocoded) {
    return null;
  }

  const daily = await fetchForecast(geocoded.latitude, geocoded.longitude, forecastDays);
  if (!daily) {
    return null;
  }

  const temperatureMax = daily.temperature_2m_max!;
  const temperatureMin = daily.temperature_2m_min!;
  const precipitationSum = daily.precipitation_sum!;

  const count = Math.min(
    forecastDays,
    temperatureMax.length,
    temperatureMin.length,
    precipitationSum.length
  );

  const expectedTempAvg = computeAverageTemperature(
    {
      time: daily.time,
      temperature_2m_max: temperatureMax,
      temperature_2m_min: temperatureMin,
      precipitation_sum: precipitationSum,
    },
    count
  );
  const rainfallMm14d = computeRainfallTotal(
    {
      time: daily.time,
      temperature_2m_max: temperatureMax,
      temperature_2m_min: temperatureMin,
      precipitation_sum: precipitationSum,
    },
    count
  );

  if (expectedTempAvg === null || rainfallMm14d === null) {
    return null;
  }

  const resolvedLocation = [geocoded.name, geocoded.admin1, geocoded.country].filter(Boolean).join(', ') || normalizedLocation;

  return {
    locationInput: normalizedLocation,
    resolvedLocation,
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
    expectedTempAvg: Math.round(expectedTempAvg * 10) / 10,
    expectedRainfall: bucketizeRainfall(rainfallMm14d),
    rainfallBucket: bucketizeRainfall(rainfallMm14d),
    rainfallMm14d: Math.round(rainfallMm14d * 10) / 10,
    weatherConfidence: calculateWeatherConfidence({
      location: normalizedLocation,
      resolvedLocation,
      dayCount: count,
      requestedDays: forecastDays,
    }),
    source: 'open-meteo',
    warnings: count < forecastDays ? ['Forecast horizon shorter than requested'] : [],
  };
}
