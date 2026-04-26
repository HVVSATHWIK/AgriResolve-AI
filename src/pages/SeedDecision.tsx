import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CloudRain,
  Clock3,
  Layers3,
  MapPin,
  RefreshCcw,
  Sprout,
  Sparkles,
  ThermometerSun,
  Wind,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { RateLimitIndicator, type RateLimitState } from '../components/RateLimitIndicator';
import { SEED_CROP_OPTIONS, SEED_PRESETS, SEED_RAINFALL_OPTIONS, SEED_SOIL_OPTIONS } from '../features/seedDecision/data';
import { useSeedRisk } from '../features/seedDecision/hooks/useSeedRisk';
import type { SeedRiskApiResponse, SeedRiskLevel } from '../features/seedDecision/types';

const riskTheme: Record<SeedRiskLevel, { bar: string; badge: string; accent: string; summary: string; icon: React.ComponentType<{ className?: string }> }> = {
  Low: {
    bar: 'from-emerald-500 to-green-400',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accent: 'bg-emerald-500',
    summary: 'Proceed with sowing. Conditions are broadly aligned for a clean start.',
    icon: BadgeCheck,
  },
  Medium: {
    bar: 'from-amber-500 to-yellow-400',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    accent: 'bg-amber-500',
    summary: 'Proceed only after checking moisture, drainage, and seed lot quality.',
    icon: Target,
  },
  High: {
    bar: 'from-orange-500 to-amber-400',
    badge: 'bg-orange-50 text-orange-800 border-orange-200',
    accent: 'bg-orange-500',
    summary: 'Delay if possible or mitigate the dominant field constraint first.',
    icon: AlertTriangle,
  },
  Critical: {
    bar: 'from-red-600 to-orange-500',
    badge: 'bg-red-50 text-red-800 border-red-200',
    accent: 'bg-red-500',
    summary: 'Current sowing conditions are unsafe. Re-plan the window before planting.',
    icon: ShieldAlert,
  },
};

function capitalize(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function mapRateLimitState(result: SeedRiskApiResponse | null): RateLimitState | null {
  if (!result?.rateLimit) return null;

  const hourly = result.rateLimit.hourly;
  return {
    requestsRemaining: hourly.remaining,
    totalQuota: hourly.limit,
    cooldownUntil: hourly.remaining <= 0 && hourly.resetTime ? new Date(hourly.resetTime) : null,
    lastRequestTime: null,
  };
}

function getFactorAccent(points: number): string {
  if (points >= 25) return 'bg-red-500';
  if (points >= 15) return 'bg-orange-500';
  if (points >= 8) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export const SeedDecision: React.FC = () => {
  const navigate = useNavigate();
  const {
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
  } = useSeedRisk();

  const riskLevel = result?.result.risk_level ?? 'Low';
  const riskStyle = riskTheme[riskLevel];
  const rateLimitState = mapRateLimitState(result);

  const summaryCards = useMemo(() => {
    if (!result) {
      return [
        { label: 'Deterministic logic', value: 'No AI score mutation' },
        { label: 'Supported crops', value: '4 canonical profiles' },
        { label: 'Weather mode', value: 'Auto or manual override' },
      ];
    }

    return [
      { label: 'Risk score', value: `${result.result.risk_score}/100` },
      { label: 'Confidence', value: `${result.result.confidence_score}%` },
      { label: 'Weather source', value: result.weather.weather_source === 'api' ? 'Lookup from location' : 'Manual input' },
    ];
  }, [result]);

  const decisionCopy = riskStyle.summary;
  const DecisionIcon = riskStyle.icon;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-[linear-gradient(135deg,#052e24_0%,#0b4f3d_56%,#14532d_100%)] text-white shadow-[0_24px_90px_rgba(4,120,87,0.22)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.18),transparent_30%),radial-gradient(circle_at_left,rgba(52,211,153,0.18),transparent_28%)]" />
        <div className="relative z-10 p-6 md:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-50/90">
              <Sparkles className="h-3.5 w-3.5" />
              Deterministic decision engine
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-50/90">
              <Layers3 className="h-3.5 w-3.5" />
              Weather-aware inputs
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-50/90">
              <BadgeCheck className="h-3.5 w-3.5" />
              Calibration-backed
            </span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Seed Decision Intelligence
            </h1>
            <p className="mt-4 text-base md:text-lg text-emerald-50/80 leading-relaxed max-w-2xl">
              Rank pre-sowing risk from soil, temperature, moisture, and seed quality. The score is deterministic;
              the weather layer only normalizes location into usable inputs.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-50/65">{card.label}</div>
                <div className="mt-2 text-lg font-black text-white">{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.04 }}
          className="rounded-[1.75rem] border border-emerald-100 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] overflow-hidden"
        >
          <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 to-white px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-700">Inputs</p>
                <h2 className="mt-1 text-xl font-black text-emerald-950">Build a sowing scenario</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to hub
              </button>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="space-y-6 p-5 md:p-6"
          >
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-bold">Request failed</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Crop</span>
                <select
                  value={form.crop}
                  onChange={(event) => updateField('crop', event.target.value as typeof form.crop)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {SEED_CROP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">
                  {SEED_CROP_OPTIONS.find((option) => option.value === form.crop)?.hint}
                </span>
                {fieldErrors.crop && <span className="text-xs font-medium text-red-600">{fieldErrors.crop}</span>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Location</span>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) => updateField('location', event.target.value)}
                    placeholder="e.g. Coimbatore, Tamil Nadu"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <span className="text-xs text-slate-500">Use a farm, town, district, or known locality.</span>
                {fieldErrors.location && <span className="text-xs font-medium text-red-600">{fieldErrors.location}</span>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Soil type</span>
                <select
                  value={form.soilType}
                  onChange={(event) => updateField('soilType', event.target.value as typeof form.soilType)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {SEED_SOIL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">
                  {SEED_SOIL_OPTIONS.find((option) => option.value === form.soilType)?.hint}
                </span>
                {fieldErrors.soilType && <span className="text-xs font-medium text-red-600">{fieldErrors.soilType}</span>}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Seed brand</span>
                <input
                  type="text"
                  value={form.seedBrand}
                  onChange={(event) => updateField('seedBrand', event.target.value)}
                  placeholder="e.g. certified hybrid, local adapted"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
                <span className="text-xs text-slate-500">Optional. Brands with local adaptation lower brand risk.</span>
                {fieldErrors.seedBrand && <span className="text-xs font-medium text-red-600">{fieldErrors.seedBrand}</span>}
              </label>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Weather input</p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">Use location lookup or manual averages</h3>
                </div>
                <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => updateField('weatherMode', 'auto')}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${form.weatherMode === 'auto' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    From location
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('weatherMode', 'manual')}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${form.weatherMode === 'manual' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Manual override
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800">Expected average temperature</span>
                  <div className="relative">
                    <ThermometerSun className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={form.expectedTempAvg}
                      onChange={(event) => updateField('expectedTempAvg', event.target.value)}
                      placeholder="e.g. 28.5"
                      disabled={form.weatherMode !== 'manual'}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition disabled:bg-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                  <span className="text-xs text-slate-500">Only required for manual weather mode.</span>
                  {fieldErrors.expectedTempAvg && <span className="text-xs font-medium text-red-600">{fieldErrors.expectedTempAvg}</span>}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800">Expected rainfall</span>
                  <div className="relative">
                    <CloudRain className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={form.expectedRainfall}
                      onChange={(event) => updateField('expectedRainfall', event.target.value as typeof form.expectedRainfall)}
                      disabled={form.weatherMode !== 'manual'}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition disabled:bg-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    >
                      {SEED_RAINFALL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs text-slate-500">
                    {SEED_RAINFALL_OPTIONS.find((option) => option.value === form.expectedRainfall)?.hint}
                  </span>
                  {fieldErrors.expectedRainfall && <span className="text-xs font-medium text-red-600">{fieldErrors.expectedRainfall}</span>}
                </label>
              </div>

              {form.weatherMode === 'auto' && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-bold">Weather will be derived from location.</p>
                  <p className="mt-1 text-emerald-800/80">
                    The backend geocodes the location, pulls Open-Meteo data, and normalizes rainfall into a low / moderate / high bucket.
                  </p>
                </div>
              )}

              {fieldErrors.weather && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {fieldErrors.weather}
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Calibrated examples</p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">Try a known decision shape</h3>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {SEED_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="text-sm font-black text-slate-950">{preset.title}</div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Evaluating...' : 'Assess seed risk'}
                <Sprout className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                Results are deterministic and reproducible for the same inputs.
              </div>
            </div>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="space-y-6"
        >
          {!result ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Decision output</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">No assessment yet</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Run a scenario to see the deterministic score, primary driver, weather trace, and calibration notes.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Sprout, label: 'Crop + soil', desc: 'Canonical profile lookup' },
                  { icon: Wind, label: 'Weather trace', desc: 'Location or manual inputs' },
                  { icon: Layers3, label: 'Interpretation', desc: 'Primary driver and factors' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <item.icon className="h-4 w-4 text-emerald-700" />
                    <div className="mt-3 text-sm font-black text-slate-900">{item.label}</div>
                    <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${riskStyle.badge}`}>
                    <DecisionIcon className="h-3.5 w-3.5" />
                    {result.result.risk_level} risk
                  </span>
                  {result.deterministic && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/90">
                      Deterministic
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/90">
                    {result.weather.weather_source === 'api' ? 'Location derived weather' : 'Manual weather input'}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">Decision snapshot</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                      {capitalize(result.result.crop)}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                      {decisionCopy}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">Risk score</div>
                      <div className="mt-1 text-3xl font-black text-white">{result.result.risk_score}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">Confidence</div>
                      <div className="mt-1 text-3xl font-black text-white">{result.result.confidence_score}%</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${toPercent(result.result.risk_score)}%` }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${riskStyle.bar}`}
                  />
                </div>
              </div>

              <div className="space-y-6 p-5 md:p-6">
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { label: 'Primary driver', value: result.result.primary_risk_driver, icon: Target },
                    { label: 'Weather source', value: result.weather.weather_source === 'api' ? 'Lookup from location' : 'Manual override', icon: Wind },
                    { label: 'Weather confidence', value: `${result.weather.weatherConfidence}%`, icon: Sparkles },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                        <item.icon className="h-3.5 w-3.5 text-emerald-700" />
                        {item.label}
                      </div>
                      <div className="mt-2 text-sm font-black text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Input trace</p>
                      <h3 className="mt-1 text-lg font-black text-slate-900">Resolved inputs</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">Crop: {capitalize(result.input.crop)}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">Soil: {capitalize(result.input.soilType)}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">Location: {result.input.location}</span>
                    {result.input.seedBrand && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">Brand: {result.input.seedBrand}</span>
                    )}
                    {result.input.expectedRainfall && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">Rainfall: {result.input.expectedRainfall}</span>
                    )}
                    {typeof result.input.expectedTempAvg === 'number' && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">Temp: {result.input.expectedTempAvg.toFixed(1)}°C</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Key factors</p>
                      <h3 className="mt-1 text-lg font-black text-slate-900">What drove the score</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{result.result.key_factors.length} factors</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {result.result.key_factors.length > 0 ? result.result.key_factors.map((factor) => (
                      <div key={factor.factor} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className={`h-2.5 w-2.5 rounded-full ${getFactorAccent(factor.points)}`} />
                              <h4 className="text-sm font-black text-slate-900">{factor.factor}</h4>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{factor.reason}</p>
                          </div>
                          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">+{factor.points}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        No significant risk driver was detected. The field is broadly aligned for sowing.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                      Explanation
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">{result.result.explanation}</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                      <Wind className="h-3.5 w-3.5 text-emerald-700" />
                      Weather trace
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-3">
                        <span>Source</span>
                        <span className="font-bold text-slate-900">{result.weather.weather_source === 'api' ? 'Location lookup' : 'Manual override'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Resolved location</span>
                        <span className="font-bold text-slate-900">{result.weather.resolvedLocation}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Rainfall bucket</span>
                        <span className="font-bold text-slate-900">{result.weather.rainfall_bucket}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Rainfall total</span>
                        <span className="font-bold text-slate-900">
                          {typeof result.weather.rainfall_mm === 'number' ? `${result.weather.rainfall_mm.toFixed(1)} mm` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Avg temperature</span>
                        <span className="font-bold text-slate-900">{result.weather.expectedTempAvg.toFixed(1)}°C</span>
                      </div>
                    </div>

                    {result.weather.warnings.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <p className="font-bold">Weather warnings</p>
                        <ul className="mt-2 space-y-1 text-amber-800">
                          {result.weather.warnings.map((warning) => (
                            <li key={warning}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`rounded-3xl border px-4 py-4 ${riskStyle.accent === 'bg-emerald-500' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : riskStyle.accent === 'bg-amber-500' ? 'border-amber-200 bg-amber-50 text-amber-900' : riskStyle.accent === 'bg-orange-500' ? 'border-orange-200 bg-orange-50 text-orange-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
                  <div className="flex items-start gap-3">
                    <DecisionIcon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-black">Recommended stance</p>
                      <p className="mt-1 text-sm leading-relaxed">{decisionCopy}</p>
                    </div>
                  </div>
                </div>

                {rateLimitState && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                      <Clock3 className="h-3.5 w-3.5 text-emerald-700" />
                      Request quota
                    </div>
                    <div className="mt-3">
                      <RateLimitIndicator state={rateLimitState} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};