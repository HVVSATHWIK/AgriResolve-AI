import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, AlertTriangle, Leaf, IndianRupee, LineChart, Target } from 'lucide-react';
import { config } from '../config';

// --- Data Interfaces ---
interface MarketPrice {
    id: string;
    commodity: string;
    state: string;
    market: string;
    min_price: number;
    max_price: number;
    modal_price: number;
    date: string;
}

interface Recommendation {
    cropName: string;
    estimatedCost: number;
    expectedRevenue: number;
    estimatedProfit: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
    finalScore: number;
    marketPrice: number;
}

interface RecommendResponse {
    success: boolean;
    recommendations: Recommendation[];
    marketPreview: MarketPrice[];
    weatherSnapshot: {
        temperature: number;
        rainfallForecastMm: number;
        humidity: number | null;
        windSpeed: number | null;
    };
    message?: string;
}

const SOIL_TYPES = ['black', 'red', 'sandy', 'loamy', 'alluvial', 'clayey'];
const SEASONS = ['Kharif', 'Rabi', 'Zaid'];
const IRRIGATION_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

// --- Components ---

const Ticker = ({ prices }: { prices: MarketPrice[] }) => {
    return (
        <div className="bg-black/90 text-white overflow-hidden py-2 border-b border-white/10 flex whitespace-nowrap">
            <motion.div
                className="flex gap-8 px-4"
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            >
                {[...prices, ...prices, ...prices].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-mono">
                        <span className="font-bold text-gray-400">{item.commodity}</span>
                        <span className="text-emerald-400">
                            ₹{item.modal_price}
                        </span>
                        <span className="text-xs text-sky-300 bg-white/5 px-1 rounded">
                            {item.market}, {item.state}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export const MarketPulse: React.FC = () => {
    useTranslation();
    const [prices, setPrices] = useState<MarketPrice[]>([]);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [loadingRecommend, setLoadingRecommend] = useState(false);
    const [recommendResult, setRecommendResult] = useState<RecommendResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        fieldSize: 1,
        soilType: 'loamy',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        season: 'Kharif',
        irrigation: 'MEDIUM',
        latitude: 16.3,
        longitude: 80.4,
    });

    const parseJsonResponse = async <T,>(response: Response): Promise<T> => {
        const contentType = response.headers.get('content-type') || '';
        const bodyText = await response.text();

        if (!contentType.includes('application/json')) {
            throw new Error(`Unexpected response format (${response.status}). Please verify backend API URL and availability.`);
        }

        try {
            return JSON.parse(bodyText) as T;
        } catch {
            throw new Error('Server returned invalid JSON response.');
        }
    };

    useEffect(() => {
        const loadPrices = async () => {
            try {
                setLoadingPrices(true);
                const response = await fetch(`${config.apiUrl}/market/prices`);
                const result = await parseJsonResponse<{ success?: boolean; data?: MarketPrice[]; message?: string }>(response);
                if (!response.ok) {
                    throw new Error(result?.message || `Failed to load market prices (${response.status})`);
                }
                if (result?.success) {
                    setPrices(result.data ?? []);
                }
            } catch (e) {
                console.error('Failed to load market prices', e);
            } finally {
                setLoadingPrices(false);
            }
        };
        loadPrices();
    }, []);

    const handleRecommend = async () => {
        try {
            setError(null);
            setLoadingRecommend(true);

            const response = await fetch(`${config.apiUrl}/market/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const result = await parseJsonResponse<RecommendResponse>(response);
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Could not generate recommendations');
            }
            setRecommendResult(result);
            if (result.marketPreview?.length) {
                setPrices(result.marketPreview);
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to generate recommendations';
            setError(message);
        } finally {
            setLoadingRecommend(false);
        }
    };

    const hasResults = !!recommendResult?.recommendations?.length;
    const topThree = recommendResult?.recommendations ?? [];

    const weatherSummary = useMemo(() => {
        if (!recommendResult?.weatherSnapshot) return null;
        return [
            { label: 'Temp', value: `${Math.round(recommendResult.weatherSnapshot.temperature)}°C` },
            { label: 'Rainfall', value: `${recommendResult.weatherSnapshot.rainfallForecastMm} mm` },
            { label: 'Humidity', value: recommendResult.weatherSnapshot.humidity == null ? 'N/A' : `${Math.round(recommendResult.weatherSnapshot.humidity)}%` },
        ];
    }, [recommendResult]);

    return (
        <div className="pb-24">
            {/* Sticky header */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
                <Ticker prices={prices.length ? prices : [{ id: 'fallback', commodity: 'Loading…', state: 'India', market: 'APMC', min_price: 0, max_price: 0, modal_price: 0, date: new Date().toISOString() }]} />
                <div className="px-3 py-2.5 sm:p-4 flex justify-between items-center max-w-5xl mx-auto">
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-2xl font-black bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent flex items-center gap-1.5 sm:gap-2 truncate">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 shrink-0" />
                            <span className="truncate">AgriWise Crop Advisor</span>
                        </h1>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Market + Weather Intelligence</p>
                    </div>
                    <div className="text-right hidden md:block shrink-0">
                        <div className="text-sm font-bold text-gray-800">data.gov.in Integrated</div>
                        <div className="text-xs text-green-600 flex items-center justify-end gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-5 sm:space-y-8">
                {/* Form + Snapshot Section */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 sm:p-5">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                            <h2 className="text-sm sm:text-lg font-bold text-gray-800">Crop Planning</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                            <label className="text-xs sm:text-sm font-medium text-gray-700">
                                Field Size (acres)
                                <input type="number" min={0.1} step={0.1} value={form.fieldSize} onChange={(e) => setForm((p) => ({ ...p, fieldSize: Number(e.target.value) }))} className="mt-1 w-full rounded-lg sm:rounded-xl border border-gray-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm" />
                            </label>

                            <label className="text-xs sm:text-sm font-medium text-gray-700">
                                Soil Type
                                <select value={form.soilType} onChange={(e) => setForm((p) => ({ ...p, soilType: e.target.value }))} className="mt-1 w-full rounded-lg sm:rounded-xl border border-gray-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm">
                                    {SOIL_TYPES.map((soil) => <option key={soil} value={soil}>{soil}</option>)}
                                </select>
                            </label>

                            <label className="text-xs sm:text-sm font-medium text-gray-700">
                                State
                                <input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} className="mt-1 w-full rounded-lg sm:rounded-xl border border-gray-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm" />
                            </label>

                            <label className="text-xs sm:text-sm font-medium text-gray-700">
                                District
                                <input value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} className="mt-1 w-full rounded-lg sm:rounded-xl border border-gray-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm" />
                            </label>

                            <label className="text-xs sm:text-sm font-medium text-gray-700">
                                Season
                                <select value={form.season} onChange={(e) => setForm((p) => ({ ...p, season: e.target.value }))} className="mt-1 w-full rounded-lg sm:rounded-xl border border-gray-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm">
                                    {SEASONS.map((season) => <option key={season} value={season}>{season}</option>)}
                                </select>
                            </label>

                            <label className="text-xs sm:text-sm font-medium text-gray-700">
                                Irrigation
                                <select value={form.irrigation} onChange={(e) => setForm((p) => ({ ...p, irrigation: e.target.value }))} className="mt-1 w-full rounded-lg sm:rounded-xl border border-gray-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm">
                                    {IRRIGATION_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                                </select>
                            </label>

                            <label className="text-xs sm:text-sm font-medium text-gray-700">
                                Latitude
                                <input type="number" step={0.0001} value={form.latitude} onChange={(e) => setForm((p) => ({ ...p, latitude: Number(e.target.value) }))} className="mt-1 w-full rounded-lg sm:rounded-xl border border-gray-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm" />
                            </label>

                            <label className="text-xs sm:text-sm font-medium text-gray-700">
                                Longitude
                                <input type="number" step={0.0001} value={form.longitude} onChange={(e) => setForm((p) => ({ ...p, longitude: Number(e.target.value) }))} className="mt-1 w-full rounded-lg sm:rounded-xl border border-gray-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm" />
                            </label>
                        </div>

                        <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <button
                                onClick={handleRecommend}
                                disabled={loadingRecommend}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white px-5 py-2.5 sm:py-3 font-semibold text-sm sm:text-base hover:bg-emerald-800 disabled:opacity-60 transition-colors"
                            >
                                <Leaf className="w-4 h-4" />
                                {loadingRecommend ? 'Computing…' : 'Get Recommendation'}
                            </button>
                            {error && <span className="text-xs sm:text-sm text-red-600 leading-tight">{error}</span>}
                        </div>
                    </div>

                    {/* Live Snapshot Sidebar */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white p-4 sm:p-5">
                        <h3 className="text-xs sm:text-sm uppercase tracking-widest text-slate-300 font-bold">Live Snapshot</h3>
                        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2 text-slate-200 text-sm">
                                <TrendingUp className="w-4 h-4 shrink-0" />
                                {loadingPrices ? 'Loading market feed…' : `${prices.length} mandi records`}
                            </div>
                            {weatherSummary ? (
                                <div className="grid grid-cols-3 sm:grid-cols-1 gap-2">
                                    {weatherSummary.map((item) => (
                                        <div key={item.label} className="rounded-lg bg-white/10 px-2.5 py-2 flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm text-center sm:text-left">
                                            <span className="text-slate-400 sm:text-white">{item.label}</span>
                                            <span className="font-semibold">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs sm:text-sm text-slate-400">Submit the form to see weather + market intelligence.</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Recommendations */}
                <section>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        <h2 className="text-sm sm:text-lg font-bold text-gray-800">Top 3 Crop Recommendations</h2>
                    </div>

                    {!hasResults && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 text-center text-gray-500 text-sm">
                            Fill the form above and click <span className="font-semibold text-gray-700">Get Recommendation</span>.
                        </div>
                    )}

                    {hasResults && (
                        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 xl:grid-cols-3 sm:gap-4 lg:gap-6">
                            {topThree.map((item, idx) => (
                                <motion.div
                                    key={item.cropName}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                        <h3 className="text-base sm:text-xl font-black text-gray-900">#{idx + 1} {item.cropName}</h3>
                                        <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full shrink-0 ${item.riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-700' : item.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {item.riskLevel} Risk
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm">
                                        <span className="text-gray-500">Cost</span><span className="font-semibold text-right">₹{item.estimatedCost.toLocaleString()}</span>
                                        <span className="text-gray-500">Revenue</span><span className="font-semibold text-right">₹{item.expectedRevenue.toLocaleString()}</span>
                                        <span className="text-gray-500">Profit</span><span className={`font-semibold text-right ${item.estimatedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{item.estimatedProfit.toLocaleString()}</span>
                                        <span className="text-gray-500">Price</span><span className="font-semibold text-right">₹{item.marketPrice}/Qt</span>
                                        <span className="text-gray-500">Score</span><span className="font-bold text-right text-indigo-700">{item.finalScore}</span>
                                    </div>

                                    <p className="mt-3 text-[11px] sm:text-xs text-gray-500 leading-relaxed">{item.reason}</p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Mandi Table — mobile card layout, desktop table */}
                <section>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        <h2 className="text-sm sm:text-lg font-bold text-gray-800">Mandi Market Feed</h2>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Commodity</th>
                                        <th className="px-4 py-3 text-left">Market</th>
                                        <th className="px-4 py-3 text-right">Modal</th>
                                        <th className="px-4 py-3 text-right">Min</th>
                                        <th className="px-4 py-3 text-right">Max</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prices.slice(0, 12).map((item) => (
                                        <tr key={item.id} className="border-t border-gray-100">
                                            <td className="px-4 py-3 font-semibold text-gray-800">{item.commodity}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.market}, {item.state}</td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-700">₹{item.modal_price}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">₹{item.min_price}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">₹{item.max_price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile card layout */}
                    <div className="sm:hidden space-y-2">
                        {prices.slice(0, 8).map((item) => (
                            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
                                <div className="min-w-0">
                                    <div className="font-semibold text-sm text-gray-800 truncate">{item.commodity}</div>
                                    <div className="text-[11px] text-gray-500 truncate">{item.market}, {item.state}</div>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <div className="font-bold text-sm text-emerald-700">₹{item.modal_price}</div>
                                    <div className="text-[10px] text-gray-400">₹{item.min_price} – ₹{item.max_price}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Notice */}
                <section className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="font-semibold text-amber-900 text-xs sm:text-base">Decision Support Notice</h4>
                        <p className="text-xs sm:text-sm text-amber-800 mt-0.5 sm:mt-1">
                            Recommendations are rule-based and market-linked. Please validate with local agronomy guidance before final sowing decisions.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
};
