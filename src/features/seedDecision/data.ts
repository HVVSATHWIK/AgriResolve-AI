import type { SeedCrop, SeedPreset, SeedRainfallLevel, SeedSoilType } from './types';

export const SEED_CROP_OPTIONS: Array<{ value: SeedCrop; label: string; hint: string }> = [
  { value: 'cotton', label: 'Cotton', hint: 'Warm season, moderate moisture, loam-friendly' },
  { value: 'chilli', label: 'Chilli', hint: 'Sensitive to excess water and temperature swings' },
  { value: 'maize', label: 'Maize', hint: 'Balanced soil, steady heat, moderate water' },
  { value: 'paddy', label: 'Paddy', hint: 'Water-loving crop with strong wet-field tolerance' },
];

export const SEED_SOIL_OPTIONS: Array<{ value: SeedSoilType; label: string; hint: string }> = [
  { value: 'clay', label: 'Clay', hint: 'Heavy, moisture-retentive field' },
  { value: 'silty-clay', label: 'Silty clay', hint: 'Heavy texture with drainage pressure' },
  { value: 'silt', label: 'Silt', hint: 'Smooth texture with moderate moisture hold' },
  { value: 'clay-loam', label: 'Clay loam', hint: 'Balanced but still moisture-retentive' },
  { value: 'loam', label: 'Loam', hint: 'Best general-purpose seedbed balance' },
  { value: 'silt-loam', label: 'Silt loam', hint: 'Moisture-friendly, workable structure' },
  { value: 'sandy-loam', label: 'Sandy loam', hint: 'Fast-draining and warm early' },
  { value: 'sand', label: 'Sand', hint: 'Very fast drainage, high drought pressure' },
];

export const SEED_RAINFALL_OPTIONS: Array<{ value: SeedRainfallLevel; label: string; hint: string }> = [
  { value: 'low', label: 'Low', hint: 'Dry sowing window or sparse forecast rain' },
  { value: 'moderate', label: 'Moderate', hint: 'Balanced moisture for most crops' },
  { value: 'high', label: 'High', hint: 'Wet sowing window with waterlogging pressure' },
];

export const SEED_PRESETS: SeedPreset[] = [
  {
    id: 'cotton-dry',
    title: 'Cotton / Dry loam',
    description: 'Shows how a fast-draining field becomes risky when moisture is limited.',
    values: {
      crop: 'cotton',
      location: 'Anantapur, Andhra Pradesh',
      soilType: 'sandy-loam',
      seedBrand: 'certified hybrid',
      weatherMode: 'manual',
      expectedTempAvg: '31',
      expectedRainfall: 'low',
    },
  },
  {
    id: 'paddy-wet',
    title: 'Paddy / Wet clay',
    description: 'Highlights water-tolerant cropping in a saturated field.',
    values: {
      crop: 'paddy',
      location: 'Cuttack, Odisha',
      soilType: 'clay',
      seedBrand: 'locally adapted',
      weatherMode: 'manual',
      expectedTempAvg: '29',
      expectedRainfall: 'high',
    },
  },
  {
    id: 'maize-balanced',
    title: 'Maize / Balanced field',
    description: 'A neutral calibration-style case for checking the score curve.',
    values: {
      crop: 'maize',
      location: 'Ludhiana, Punjab',
      soilType: 'loam',
      seedBrand: 'certified hybrid',
      weatherMode: 'manual',
      expectedTempAvg: '24',
      expectedRainfall: 'moderate',
    },
  },
];