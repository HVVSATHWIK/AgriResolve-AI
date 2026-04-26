export type SeedCrop = 'cotton' | 'chilli' | 'maize' | 'paddy';

export type SeedSoilType =
  | 'clay'
  | 'silty-clay'
  | 'silt'
  | 'clay-loam'
  | 'loam'
  | 'silt-loam'
  | 'sandy-loam'
  | 'sand';

export type SeedRainfallLevel = 'low' | 'moderate' | 'high';

export type SeedRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface SeedRiskFormState {
  crop: SeedCrop;
  location: string;
  soilType: SeedSoilType;
  seedBrand: string;
  weatherMode: 'auto' | 'manual';
  expectedTempAvg: string;
  expectedRainfall: SeedRainfallLevel;
}

export interface SeedRiskFactor {
  factor: string;
  impact: 'negative' | 'positive';
  points: number;
  reason: string;
}

export interface SeedRiskDecision {
  crop: string;
  risk_score: number;
  risk_level: SeedRiskLevel;
  confidence_score: number;
  primary_risk_driver: string;
  key_factors: SeedRiskFactor[];
  explanation: string;
}

export interface SeedRiskInputEcho {
  crop: SeedCrop;
  location: string;
  soilType: SeedSoilType;
  expectedRainfall?: SeedRainfallLevel | null;
  expectedTempAvg?: number | null;
  seedBrand?: string | null;
}

export interface SeedRiskWeatherTrace {
  weather_source: 'manual' | 'api';
  location: string;
  resolvedLocation: string;
  expectedTempAvg: number;
  expectedRainfall: SeedRainfallLevel;
  rainfall_bucket: SeedRainfallLevel;
  rainfall_mm: number | null;
  weatherConfidence: number;
  latitude: number | null;
  longitude: number | null;
  warnings: string[];
}

export interface SeedRiskRateLimitBucket {
  limit: number;
  remaining: number;
  used: number;
  resetTime?: string;
}

export interface SeedRiskRateLimitInfo {
  shortTerm: SeedRiskRateLimitBucket;
  hourly: SeedRiskRateLimitBucket;
}

export interface SeedRiskRequest {
  crop: SeedCrop;
  location: string;
  soilType: SeedSoilType;
  seedBrand?: string;
  expectedTempAvg?: number;
  expectedRainfall?: SeedRainfallLevel;
}

export interface SeedRiskApiResponse {
  success: boolean;
  timestamp: string;
  input: SeedRiskInputEcho;
  weather: SeedRiskWeatherTrace;
  result: SeedRiskDecision;
  rateLimit?: SeedRiskRateLimitInfo;
  deterministic?: boolean;
}

export interface SeedRiskApiErrorDetail {
  field: string;
  message: string;
}

export interface SeedRiskPreset {
  id: string;
  title: string;
  description: string;
  values: SeedRiskFormState;
}

export type SeedPreset = SeedRiskPreset;