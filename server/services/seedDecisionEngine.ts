import { readFileSync } from 'fs';
import { resolve } from 'path';

export type RainfallLevel = 'low' | 'moderate' | 'high';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type SoilType = 'clay' | 'silty-clay' | 'silt' | 'clay-loam' | 'loam' | 'silt-loam' | 'sandy-loam' | 'sand';
export type WaterRequirement = 'low' | 'moderate' | 'high';

export interface CropProfile {
  preferredSoil: SoilType[];
  tempMin: number;
  tempOptMin: number;
  tempOptMax: number;
  waterReq: WaterRequirement;
  toleratesWaterlogging: boolean;
}

export interface SeedRiskInput {
  crop: string;
  soilType: SoilType;
  expectedRainfall: RainfallLevel;
  expectedTempAvg: number;
  seedBrand?: string | null;
  weatherConfidence?: number;
}

export interface RiskFactor {
  factor: string;
  impact: 'negative' | 'positive';
  points: number;
  reason: string;
}

export interface SeedRiskResult {
  crop: string;
  risk_score: number;
  risk_level: RiskLevel;
  confidence_score: number;
  primary_risk_driver: string;
  key_factors: RiskFactor[];
  explanation: string;
}

export interface CalibrationCase {
  id: string;
  crop: string;
  soilType: SoilType;
  expectedRainfall: RainfallLevel;
  expectedTempAvg: number;
  expectedRiskLevel: RiskLevel;
  notes?: string;
}

export interface CalibrationCaseResult extends CalibrationCase {
  actualRiskScore: number;
  actualRiskLevel: RiskLevel;
  primaryRiskDriver: string;
  explanation: string;
  keyFactors: RiskFactor[];
  matches: boolean;
}

export interface CalibrationReport {
  cases: CalibrationCaseResult[];
  mismatchCount: number;
  suggestedAdjustments: string[];
}

export interface RiskFactorComputation {
  factor: RiskFactor | null;
  interactionTriggered: boolean;
}

export const RISK_LEVEL_BANDS: Record<RiskLevel, [number, number]> = {
  Low: [0, 19],
  Medium: [20, 34],
  High: [35, 64],
  Critical: [65, 100],
};

export const cropDatabase = JSON.parse(
  readFileSync(resolve(process.cwd(), 'server/data/crop_database.json'), 'utf8')
) as Record<string, CropProfile>;

const HEAVY_SOILS: SoilType[] = ['clay', 'silty-clay'];
const BALANCED_SOILS: SoilType[] = ['loam', 'clay-loam', 'silt', 'silt-loam'];
const FREE_DRAINING_SOILS: SoilType[] = ['sandy-loam', 'sand'];

const SOIL_PRIORITY = 0;
const TEMPERATURE_PRIORITY = 1;
const MOISTURE_PRIORITY = 2;
const BRAND_PRIORITY = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isHeavySoil(soilType: SoilType): boolean {
  return HEAVY_SOILS.includes(soilType);
}

function isBalancedSoil(soilType: SoilType): boolean {
  return BALANCED_SOILS.includes(soilType);
}

function isFreeDrainingSoil(soilType: SoilType): boolean {
  return FREE_DRAINING_SOILS.includes(soilType);
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= RISK_LEVEL_BANDS.Low[1]) return 'Low';
  if (score <= RISK_LEVEL_BANDS.Medium[1]) return 'Medium';
  if (score <= RISK_LEVEL_BANDS.High[1]) return 'High';
  return 'Critical';
}

function compareRiskLevels(a: RiskLevel, b: RiskLevel): number {
  const order: Record<RiskLevel, number> = {
    Low: 0,
    Medium: 1,
    High: 2,
    Critical: 3,
  };

  return order[a] - order[b];
}

export function getCropProfile(crop: string): CropProfile {
  const cropKey = normalizeKey(crop);
  const profile = cropDatabase[cropKey];

  if (!profile) {
    throw new Error(`Unsupported crop: ${crop}`);
  }

  return profile;
}

function calculateSoilRisk(crop: CropProfile, soilType: SoilType, expectedRainfall: RainfallLevel): RiskFactorComputation {
  const preferredMatch = crop.preferredSoil.includes(soilType);

  if (preferredMatch) {
    if (expectedRainfall === 'high' && !crop.toleratesWaterlogging && isHeavySoil(soilType)) {
      return {
        factor: {
          factor: 'Soil Compatibility',
          impact: 'negative',
          points: 30,
          reason: 'High rainfall on a heavy preferred soil still creates waterlogging pressure for crops that do not tolerate excess moisture.',
        },
        interactionTriggered: true,
      };
    }

    if (expectedRainfall === 'low' && isFreeDrainingSoil(soilType) && crop.waterReq !== 'low') {
      return {
        factor: {
          factor: 'Soil Compatibility',
          impact: 'negative',
          points: crop.waterReq === 'high' ? 14 : 10,
          reason: 'The soil is texturally suitable, but a fast-draining seedbed becomes risky when the sowing window is dry for a crop that needs steady moisture.',
        },
        interactionTriggered: true,
      };
    }

    return {
      factor: null,
      interactionTriggered: false,
    };
  }

  let points = 0;
  let reason = '';
  let interactionTriggered = false;

  if (isHeavySoil(soilType)) {
    points = crop.toleratesWaterlogging ? 8 : 18;
    reason = crop.toleratesWaterlogging
      ? 'Heavy soil is not ideal for this crop, but water tolerance softens the penalty.'
      : 'Heavy soil is a poor fit and may stay too wet for early seed establishment.';

    if (expectedRainfall === 'high' && !crop.toleratesWaterlogging) {
      points = 30;
      reason = 'Heavy soil combined with high rainfall creates a strong waterlogging and rot risk.';
      interactionTriggered = true;
    }
  } else if (isBalancedSoil(soilType)) {
    if (crop.waterReq === 'high' && expectedRainfall === 'low') {
      points = 18;
      reason = 'Balanced soil becomes risky when the crop needs more water than the sowing window is likely to provide.';
    } else if (expectedRainfall === 'high' && !crop.toleratesWaterlogging) {
      points = 16;
      reason = 'Balanced soil still becomes risky under sustained heavy rain for crops sensitive to excess moisture.';
      interactionTriggered = true;
    } else if (expectedRainfall === 'low' && crop.waterReq === 'moderate') {
      points = 12;
      reason = 'Balanced soil alone cannot offset a dry sowing window for a crop that expects steady moisture.';
    } else {
      points = 10;
      reason = 'Soil is usable but not aligned closely enough with the crop profile to be risk-free.';
    }
  } else if (isFreeDrainingSoil(soilType)) {
    if (crop.waterReq === 'high' && expectedRainfall === 'low') {
      points = 30;
      reason = 'Free-draining soil with low rainfall is too dry for a crop that needs sustained moisture.';
      interactionTriggered = true;
    } else if (crop.waterReq === 'moderate' && expectedRainfall === 'low') {
      points = 18;
      reason = 'Fast-draining soil plus a dry window can leave the seedbed under-moistened for moderate-water crops.';
      interactionTriggered = true;
    } else if (expectedRainfall === 'high' && !crop.toleratesWaterlogging) {
      points = 12;
      reason = 'Fast-draining soil helps, but the crop still faces a mismatch against the soil profile under heavy rain.';
    } else {
      points = 12;
      reason = 'The soil texture is usable but not strongly aligned with the crop profile.';
    }
  }

  return {
    factor: {
      factor: 'Soil Compatibility',
      impact: 'negative',
      points: clamp(points, 0, 35),
      reason,
    },
    interactionTriggered,
  };
}

function calculateTemperatureRisk(crop: CropProfile, expectedTempAvg: number): RiskFactorComputation {
  if (expectedTempAvg < crop.tempMin) {
    const gap = crop.tempMin - expectedTempAvg;
    const points = gap >= 3 ? 35 : gap === 2 ? 25 : 20;

    return {
      factor: {
        factor: 'Temperature Viability',
        impact: 'negative',
        points,
        reason: gap >= 3
          ? 'Expected temperature is below the germination minimum by enough to threaten emergence.'
          : 'Expected temperature is slightly below the germination minimum, which can slow or weaken emergence.',
      },
      interactionTriggered: false,
    };
  }

  if (expectedTempAvg < crop.tempOptMin) {
    const gapToOptimum = crop.tempOptMin - expectedTempAvg;
    const points = gapToOptimum <= 1 ? 5 : gapToOptimum <= 3 ? 10 : gapToOptimum <= 5 ? 12 : 15;

    return {
      factor: {
        factor: 'Temperature Viability',
        impact: 'negative',
        points,
        reason: 'Temperature is above the minimum but still below the crop’s optimal germination band.',
      },
      interactionTriggered: false,
    };
  }

  if (expectedTempAvg <= crop.tempOptMax) {
    return {
      factor: null,
      interactionTriggered: false,
    };
  }

  const heatGap = expectedTempAvg - crop.tempOptMax;
  const points = heatGap <= 1 ? 8 : heatGap <= 3 ? 15 : heatGap <= 5 ? 22 : 30;

  return {
    factor: {
      factor: 'Temperature Viability',
      impact: 'negative',
      points,
      reason: 'Expected temperature is above the crop’s upper comfort band and may suppress germination or early vigor.',
    },
    interactionTriggered: false,
  };
}

function calculateMoistureRisk(
  crop: CropProfile,
  expectedRainfall: RainfallLevel,
  soilType: SoilType,
  soilInteractionTriggered: boolean
): RiskFactorComputation {
  let points = 0;

  if (crop.waterReq === 'high') {
    points = expectedRainfall === 'low' ? 20 : expectedRainfall === 'moderate' ? 8 : 0;
  } else if (crop.waterReq === 'moderate') {
    points = expectedRainfall === 'low' ? 15 : expectedRainfall === 'moderate' ? 0 : 10;
  } else {
    points = expectedRainfall === 'low' ? 5 : expectedRainfall === 'moderate' ? 0 : 10;
  }

  const rainfallSoilOverlap =
    (expectedRainfall === 'high' && isHeavySoil(soilType) && !crop.toleratesWaterlogging) ||
    (expectedRainfall === 'low' && isFreeDrainingSoil(soilType) && crop.waterReq !== 'low');

  if (soilInteractionTriggered || rainfallSoilOverlap) {
    points = Math.round(points * 0.5);
  }

  if (points <= 0) {
    return {
      factor: null,
      interactionTriggered: false,
    };
  }

  let reason = '';
  if (crop.waterReq === 'high' && expectedRainfall === 'low') {
    reason = 'Rainfall is too low for a crop that needs a consistently moist seedbed.';
  } else if (crop.waterReq === 'moderate' && expectedRainfall === 'low') {
    reason = 'Rainfall is below the moisture level normally needed for steady germination.';
  } else if (expectedRainfall === 'high' && crop.waterReq !== 'high') {
    reason = 'Rainfall is heavier than the crop typically needs, which can slow establishment in sensitive conditions.';
  } else {
    reason = 'Moisture availability is not perfectly aligned with the crop’s early establishment needs.';
  }

  return {
    factor: {
      factor: 'Moisture / Rainfall',
      impact: 'negative',
      points: clamp(points, 0, 20),
      reason,
    },
    interactionTriggered: false,
  };
}

function calculateBrandRisk(seedBrand?: string | null): RiskFactorComputation {
  if (!seedBrand || !seedBrand.trim()) {
    return {
      factor: null,
      interactionTriggered: false,
    };
  }

  const normalized = seedBrand.trim().toLowerCase();

  if (['local', 'locally adapted', 'certified', 'resilient', 'hybrid'].some((keyword) => normalized.includes(keyword))) {
    return {
      factor: null,
      interactionTriggered: false,
    };
  }

  if (['unknown', 'unverified', 'generic', 'imported'].some((keyword) => normalized.includes(keyword))) {
    return {
      factor: {
        factor: 'Brand / Regional Confidence',
        impact: 'negative',
        points: 5,
        reason: 'Brand information is too weak to provide strong regional confidence, so only a minimal penalty is applied.',
      },
      interactionTriggered: false,
    };
  }

  return {
    factor: {
      factor: 'Brand / Regional Confidence',
      impact: 'negative',
      points: 2,
      reason: 'Brand is not clearly recognized as locally adapted, so only a very small regional-confidence penalty is applied.',
    },
    interactionTriggered: false,
  };
}

function calculateConfidenceScore(input: SeedRiskInput): number {
  let score = 100;

  if (!input.crop || !normalizeKey(input.crop)) score -= 40;
  if (!input.soilType) score -= 20;
  if (!input.expectedRainfall) score -= 20;
  if (!isFiniteNumber(input.expectedTempAvg)) score -= 20;
  if (isFiniteNumber(input.weatherConfidence)) {
    score = Math.min(score, clamp(input.weatherConfidence, 0, 100));
  }

  return clamp(score, 0, 100);
}

function buildExplanation(crop: string, riskLevel: RiskLevel, primaryRiskDriver: string, keyFactors: RiskFactor[]): string {
  if (riskLevel === 'Low') {
    return `${crop} looks suitable under these conditions. Soil, temperature, and moisture are broadly aligned for early germination.`;
  }

  const primaryReason = keyFactors[0]?.reason ?? 'the overall sowing conditions are not ideal';
  const secondaryReason = keyFactors[1]?.reason;

  let explanation = `${crop} faces ${riskLevel.toLowerCase()} seed risk mainly because ${primaryReason}`;

  if (secondaryReason) {
    explanation += ` A second pressure comes from ${secondaryReason.toLowerCase()}`;
  }

  explanation += `.`;

  if (primaryRiskDriver !== 'No significant risk driver detected') {
    explanation += ` The dominant issue is ${primaryRiskDriver.toLowerCase()}.`;
  }

  return explanation;
}

function sortFactorsBySeverity(factors: RiskFactor[]): RiskFactor[] {
  return [...factors].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    const priority: Record<string, number> = {
      'Soil Compatibility': SOIL_PRIORITY,
      'Temperature Viability': TEMPERATURE_PRIORITY,
      'Moisture / Rainfall': MOISTURE_PRIORITY,
      'Brand / Regional Confidence': BRAND_PRIORITY,
    };

    return (priority[left.factor] ?? 99) - (priority[right.factor] ?? 99);
  });
}

function getPrimaryRiskDriver(factors: RiskFactor[]): string {
  if (factors.length === 0) {
    return 'No significant risk driver detected';
  }

  return sortFactorsBySeverity(factors)[0].factor;
}

export function evaluateSeedRisk(input: SeedRiskInput): SeedRiskResult {
  const crop = getCropProfile(input.crop);
  const normalizedSoil = input.soilType;

  const soilRisk = calculateSoilRisk(crop, normalizedSoil, input.expectedRainfall);
  const temperatureRisk = calculateTemperatureRisk(crop, input.expectedTempAvg);
  const moistureRisk = calculateMoistureRisk(crop, input.expectedRainfall, normalizedSoil, soilRisk.interactionTriggered);
  const brandRisk = calculateBrandRisk(input.seedBrand);

  const keyFactors = [soilRisk.factor, temperatureRisk.factor, moistureRisk.factor, brandRisk.factor]
    .filter((factor): factor is RiskFactor => Boolean(factor && factor.points > 0));

  const riskScore = clamp(
    keyFactors.reduce((total, factor) => total + factor.points, 0),
    0,
    100
  );

  const riskLevel = getRiskLevel(riskScore);
  const primaryRiskDriver = getPrimaryRiskDriver(keyFactors);
  const confidenceScore = calculateConfidenceScore(input);

  const orderedFactors = sortFactorsBySeverity(keyFactors);

  return {
    crop: normalizeKey(input.crop),
    risk_score: riskScore,
    risk_level: riskLevel,
    confidence_score: confidenceScore,
    primary_risk_driver: primaryRiskDriver,
    key_factors: orderedFactors,
    explanation: buildExplanation(normalizeKey(input.crop), riskLevel, primaryRiskDriver, orderedFactors),
  };
}

export function evaluateCalibrationCase(testCase: CalibrationCase): CalibrationCaseResult {
  const result = evaluateSeedRisk({
    crop: testCase.crop,
    soilType: testCase.soilType,
    expectedRainfall: testCase.expectedRainfall,
    expectedTempAvg: testCase.expectedTempAvg,
  });

  return {
    ...testCase,
    actualRiskScore: result.risk_score,
    actualRiskLevel: result.risk_level,
    primaryRiskDriver: result.primary_risk_driver,
    explanation: result.explanation,
    keyFactors: result.key_factors,
    matches: compareRiskLevels(result.risk_level, testCase.expectedRiskLevel) === 0,
  };
}
