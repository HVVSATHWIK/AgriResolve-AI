import { cropDatabase, evaluateCalibrationCase, evaluateSeedRisk, getCropProfile } from '../seedDecisionEngine.js';
import { evaluateCalibrationSet, getCalibrationCases } from '../seedCalibration.js';

describe('Seed Decision Engine', () => {
  it('loads the crop knowledge base with the expected core crops', () => {
    expect(cropDatabase.cotton).toBeDefined();
    expect(cropDatabase.chilli).toBeDefined();
    expect(cropDatabase.maize).toBeDefined();
    expect(cropDatabase.paddy).toBeDefined();
  });

  it('returns agronomically consistent profiles', () => {
    const cotton = getCropProfile('cotton');
    const paddy = getCropProfile('paddy');

    expect(cotton.preferredSoil).toContain('loam');
    expect(cotton.toleratesWaterlogging).toBe(false);
    expect(paddy.preferredSoil).toContain('clay');
    expect(paddy.toleratesWaterlogging).toBe(true);
  });

  it('distinguishes cotton from paddy under identical clay and heavy-rain conditions', () => {
    const cotton = evaluateSeedRisk({
      crop: 'cotton',
      soilType: 'clay',
      expectedRainfall: 'high',
      expectedTempAvg: 28,
    });

    const paddy = evaluateSeedRisk({
      crop: 'paddy',
      soilType: 'clay',
      expectedRainfall: 'high',
      expectedTempAvg: 28,
    });

    expect(cotton.risk_level).toBe('High');
    expect(paddy.risk_level).toBe('Low');
    expect(cotton.risk_score).toBeGreaterThan(paddy.risk_score);
  });

  it('selects the highest-penalty factor as the primary risk driver', () => {
    const result = evaluateSeedRisk({
      crop: 'paddy',
      soilType: 'loam',
      expectedRainfall: 'low',
      expectedTempAvg: 22,
    });

    expect(result.primary_risk_driver).toBe('Moisture / Rainfall');
    expect(result.key_factors[0].factor).toBe('Moisture / Rainfall');
  });

  it('reduces confidence when weather reliability is lower', () => {
    const manual = evaluateSeedRisk({
      crop: 'cotton',
      soilType: 'loam',
      expectedRainfall: 'moderate',
      expectedTempAvg: 28,
      weatherConfidence: 100,
    });

    const derived = evaluateSeedRisk({
      crop: 'cotton',
      soilType: 'loam',
      expectedRainfall: 'moderate',
      expectedTempAvg: 28,
      weatherConfidence: 72,
    });

    expect(manual.confidence_score).toBe(100);
    expect(derived.confidence_score).toBe(72);
    expect(derived.confidence_score).toBeLessThan(manual.confidence_score);
  });

  it('produces the expected risk level for every calibration case', () => {
    const cases = getCalibrationCases();

    for (const testCase of cases) {
      const result = evaluateCalibrationCase(testCase);
      expect(result.actualRiskLevel).toBe(testCase.expectedRiskLevel);
      expect(result.matches).toBe(true);
    }
  });

  it('generates a clean calibration report with no mismatches for the current data set', () => {
    const report = evaluateCalibrationSet();

    expect(report.mismatchCount).toBe(0);
    expect(report.suggestedAdjustments).toEqual(['No threshold changes required for the current calibration set.']);
  });

  it('keeps the score deterministic for repeated identical inputs', () => {
    const input = {
      crop: 'maize',
      soilType: 'sand' as const,
      expectedRainfall: 'low' as const,
      expectedTempAvg: 17,
    };

    const first = evaluateSeedRisk(input);
    const second = evaluateSeedRisk(input);

    expect(first).toEqual(second);
  });
});