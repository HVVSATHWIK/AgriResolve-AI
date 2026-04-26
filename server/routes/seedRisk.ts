import { Router, Request, Response } from 'express';
import { getRateLimitInfo } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';
import { cropDatabase, evaluateSeedRisk, type RainfallLevel, type SoilType } from '../services/seedDecisionEngine.js';
import { resolveWeatherForLocation, type DerivedWeatherContext } from '../services/weatherAdapter.js';

const router = Router();

const SUPPORTED_RAINFALL_LEVELS: RainfallLevel[] = ['low', 'moderate', 'high'];
const SUPPORTED_SOIL_TYPES: SoilType[] = ['clay', 'silty-clay', 'silt', 'clay-loam', 'loam', 'silt-loam', 'sandy-loam', 'sand'];

type SeedRiskRequestBody = {
  crop?: unknown;
  location?: unknown;
  soilType?: unknown;
  expectedRainfall?: unknown;
  expectedTempAvg?: unknown;
  seedBrand?: unknown;
};

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseRainfallLevel(value: unknown): RainfallLevel | null {
  const normalized = normalizeString(value).toLowerCase();
  return SUPPORTED_RAINFALL_LEVELS.includes(normalized as RainfallLevel)
    ? (normalized as RainfallLevel)
    : null;
}

function parseSoilType(value: unknown): SoilType | null {
  const normalized = normalizeString(value).toLowerCase();
  return SUPPORTED_SOIL_TYPES.includes(normalized as SoilType)
    ? (normalized as SoilType)
    : null;
}

function parseTemperature(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

router.post('/', async (req: Request, res: Response) => {
  const body = (req.body || {}) as SeedRiskRequestBody;
  const errors: Array<{ field: string; message: string }> = [];

  const crop = normalizeString(body.crop).toLowerCase();
  const location = normalizeString(body.location);
  const soilType = parseSoilType(body.soilType);
  const expectedRainfall = parseRainfallLevel(body.expectedRainfall);
  const expectedTempAvg = parseTemperature(body.expectedTempAvg);
  const seedBrand = normalizeString(body.seedBrand) || null;

  if (!crop) {
    errors.push({ field: 'crop', message: 'Crop is required.' });
  } else if (!cropDatabase[crop]) {
    errors.push({ field: 'crop', message: `Unsupported crop. Supported crops: ${Object.keys(cropDatabase).join(', ')}.` });
  }

  if (!location) {
    errors.push({ field: 'location', message: 'Location is required.' });
  }

  if (!soilType) {
    errors.push({ field: 'soilType', message: `Supported soil types: ${SUPPORTED_SOIL_TYPES.join(', ')}.` });
  }

  const manualTempProvided = body.expectedTempAvg !== undefined && body.expectedTempAvg !== null && String(body.expectedTempAvg).trim() !== '';
  const manualRainProvided = body.expectedRainfall !== undefined && body.expectedRainfall !== null && String(body.expectedRainfall).trim() !== '';

  if (manualTempProvided !== manualRainProvided) {
    errors.push({
      field: 'weather',
      message: 'Provide both expectedTempAvg and expectedRainfall together, or omit both to derive them from location.'
    });
  }

  if (manualTempProvided && manualRainProvided) {
    if (!expectedRainfall) {
      errors.push({ field: 'expectedRainfall', message: `Expected rainfall must be one of: ${SUPPORTED_RAINFALL_LEVELS.join(', ')}.` });
    }

    if (expectedTempAvg === null) {
      errors.push({ field: 'expectedTempAvg', message: 'Expected average temperature is required as a finite number.' });
    }
  }

  if (errors.length > 0) {
    logger.warn('Seed risk request validation failed', { errors, body });
    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid seed risk request.',
      errors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  let derivedWeather: DerivedWeatherContext | null = null;
  let resolvedTempAvg: number | null = expectedTempAvg;
  let resolvedRainfall: RainfallLevel | null = expectedRainfall;
  let weatherConfidence = 100;
  let weatherSource: 'manual' | 'api' = 'manual';

  if (!manualTempProvided && !manualRainProvided) {
    derivedWeather = await resolveWeatherForLocation(location);

    if (!derivedWeather) {
      logger.warn('Seed risk weather lookup failed', { crop, location, soilType });
      res.status(503).json({
        error: 'Weather Lookup Failed',
        code: 'WEATHER_LOOKUP_FAILED',
        message: 'Could not derive weather for the provided location. Please supply expectedTempAvg and expectedRainfall manually.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    resolvedTempAvg = derivedWeather.expectedTempAvg;
    resolvedRainfall = derivedWeather.expectedRainfall;
    weatherConfidence = derivedWeather.weatherConfidence;
    weatherSource = 'api';
  }

  if (resolvedTempAvg === null || !resolvedRainfall) {
    logger.warn('Seed risk weather resolution incomplete', { crop, location, soilType });
    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Weather inputs could not be resolved.',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const result = evaluateSeedRisk({
    crop,
    soilType: soilType as SoilType,
    expectedRainfall: resolvedRainfall,
    expectedTempAvg: resolvedTempAvg,
    seedBrand,
    weatherConfidence,
  });

  const rateLimitInfo = getRateLimitInfo(req);

  const weatherPayload = {
    weather_source: weatherSource,
    location,
    resolvedLocation: derivedWeather?.resolvedLocation ?? location,
    expectedTempAvg: resolvedTempAvg,
    expectedRainfall: resolvedRainfall,
    rainfall_bucket: derivedWeather?.rainfallBucket ?? resolvedRainfall,
    rainfall_mm: derivedWeather?.rainfallMm14d ?? null,
    weatherConfidence,
    latitude: derivedWeather?.latitude ?? null,
    longitude: derivedWeather?.longitude ?? null,
    warnings: derivedWeather?.warnings ?? [],
  };

  logger.info('Seed risk evaluated', {
    input: { crop, location, soilType, seedBrand },
    derivedWeather: weatherPayload,
    score: result.risk_score,
    factors: result.key_factors,
    dominant: result.primary_risk_driver,
  });

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    input: {
      crop,
      location,
      soilType,
      expectedRainfall,
      expectedTempAvg,
      seedBrand,
    },
    weather: weatherPayload,
    result,
    rateLimit: rateLimitInfo,
    deterministic: true,
  });
});

export { router as seedRiskRouter };