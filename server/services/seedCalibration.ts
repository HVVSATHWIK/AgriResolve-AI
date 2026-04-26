import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  evaluateCalibrationCase,
  type CalibrationCase,
  type CalibrationCaseResult,
  type CalibrationReport,
} from './seedDecisionEngine.js';

const calibrationCases = JSON.parse(
  readFileSync(resolve(process.cwd(), 'server/data/crop_calibration_cases.json'), 'utf8')
) as CalibrationCase[];

export function getCalibrationCases(): CalibrationCase[] {
  return calibrationCases;
}

function suggestThresholdAdjustments(results: CalibrationCaseResult[]): string[] {
  const mismatches = results.filter((item) => !item.matches);

  if (mismatches.length === 0) {
    return ['No threshold changes required for the current calibration set.'];
  }

  const suggestions = new Set<string>();

  if (mismatches.some((item) => item.crop === 'cotton' || item.crop === 'paddy')) {
    suggestions.add('Strengthen the crop-specific soil-water separation so cotton and paddy diverge more clearly under identical conditions.');
  }

  if (mismatches.some((item) => item.expectedTempAvg < 20 || item.expectedTempAvg > 32)) {
    suggestions.add('Revisit the temperature penalty curve around germination minimums and upper comfort bands.');
  }

  if (mismatches.some((item) => item.expectedRainfall === 'low' || item.expectedRainfall === 'high')) {
    suggestions.add('Check the soil-moisture coupling multiplier so overlap is damped without flattening true drought or waterlogging risk.');
  }

  return Array.from(suggestions);
}

export function evaluateCalibrationSet(cases: CalibrationCase[] = calibrationCases): CalibrationReport {
  const evaluated = cases.map((testCase) => evaluateCalibrationCase(testCase));
  const mismatchCount = evaluated.filter((item) => !item.matches).length;

  return {
    cases: evaluated,
    mismatchCount,
    suggestedAdjustments: suggestThresholdAdjustments(evaluated),
  };
}
