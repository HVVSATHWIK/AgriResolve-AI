import { useMemo, useState } from 'react';
import { callSeedRiskAPI, SeedRiskApiError } from '../../../services/seedRisk';
import type {
  SeedCrop,
  SeedPreset,
  SeedRainfallLevel,
  SeedRiskApiResponse,
  SeedRiskFormState,
  SeedSoilType,
} from '../types';

const DEFAULT_FORM_STATE: SeedRiskFormState = {
  crop: 'cotton',
  location: '',
  soilType: 'loam',
  seedBrand: '',
  weatherMode: 'auto',
  expectedTempAvg: '',
  expectedRainfall: 'moderate',
};

type FieldErrors = Partial<Record<keyof SeedRiskFormState | 'weather' | 'submission', string>>;

export function useSeedRisk() {
  const [form, setForm] = useState<SeedRiskFormState>(DEFAULT_FORM_STATE);
  const [result, setResult] = useState<SeedRiskApiResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearErrors = (keys?: Array<keyof FieldErrors>) => {
    if (!keys || keys.length === 0) {
      setError(null);
      setFieldErrors({});
      return;
    }

    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of keys) {
        delete next[key];
      }
      return next;
    });
  };

  const updateField = <K extends keyof SeedRiskFormState>(field: K, value: SeedRiskFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearErrors([field, 'weather', 'submission']);
  };

  const applyPreset = (preset: SeedPreset) => {
    setForm(preset.values);
    clearErrors();
    setResult(null);
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM_STATE);
    setResult(null);
    clearErrors();
  };

  const canSubmit = useMemo(() => {
    const hasLocation = form.location.trim().length > 0;
    const hasCrop = Boolean(form.crop);
    const hasSoil = Boolean(form.soilType);

    if (!hasCrop || !hasLocation || !hasSoil) {
      return false;
    }

    if (form.weatherMode === 'manual') {
      return form.expectedTempAvg.trim().length > 0 && Boolean(form.expectedRainfall);
    }

    return true;
  }, [form]);

  const submit = async () => {
    const trimmedLocation = form.location.trim();
    const trimmedBrand = form.seedBrand.trim();
    const manualWeather = form.weatherMode === 'manual';
    const parsedTemp = manualWeather ? Number(form.expectedTempAvg) : undefined;

    setIsSubmitting(true);
    setError(null);
    clearErrors();

    try {
      const response = await callSeedRiskAPI({
        crop: form.crop,
        location: trimmedLocation,
        soilType: form.soilType,
        seedBrand: trimmedBrand || undefined,
        expectedTempAvg: manualWeather ? parsedTemp : undefined,
        expectedRainfall: manualWeather ? form.expectedRainfall : undefined,
      });

      setResult(response);
      return response;
    } catch (caughtError) {
      if (caughtError instanceof SeedRiskApiError) {
        setError(caughtError.message);

        if (caughtError.details && caughtError.details.length > 0) {
          const nextErrors: FieldErrors = {};
          for (const detail of caughtError.details) {
            nextErrors[detail.field as keyof FieldErrors] = detail.message;
          }
          setFieldErrors(nextErrors);
        }
      } else {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to evaluate seed risk.');
      }

      throw caughtError;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    result,
    isSubmitting,
    error,
    fieldErrors,
    canSubmit,
    updateField,
    applyPreset,
    resetForm,
    submit,
    setWeatherMode: (mode: 'auto' | 'manual') => updateField('weatherMode', mode),
    setCrop: (crop: SeedCrop) => updateField('crop', crop),
    setLocation: (location: string) => updateField('location', location),
    setSoilType: (soilType: SeedSoilType) => updateField('soilType', soilType),
    setSeedBrand: (seedBrand: string) => updateField('seedBrand', seedBrand),
    setExpectedTempAvg: (expectedTempAvg: string) => updateField('expectedTempAvg', expectedTempAvg),
    setExpectedRainfall: (expectedRainfall: SeedRainfallLevel) => updateField('expectedRainfall', expectedRainfall),
  };
}