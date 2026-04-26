import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sprout, TrendingUp, Scan, CalendarDays, Activity, Clock } from 'lucide-react';
import { HistoryService } from '../features/history/services/HistoryService';
import { AgriTwinMark } from '../components/AgriTwinMark';
import { buildAppRoute } from '../lib/navigation';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [lastScanDate, setLastScanDate] = useState<string | null>(null);
    const [scansThisMonth, setScansThisMonth] = useState<number>(0);

    const buildDiagnosisRoute = (mode?: 'bioprospector') => {
        return buildAppRoute('/diagnosis', location.search, mode ? { mode } : {});
    };

    const buildSeedDecisionRoute = () => buildAppRoute('/seed-decision', location.search);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const records = await HistoryService.getAllRecords();
                if (records.length > 0) {
                    const lastRecord = records[0];
                    setLastScanDate(new Date(lastRecord.timestamp).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                    }));

                    // Count scans this calendar month
                    const now = new Date();
                    const thisMonth = records.filter(r => {
                        const d = new Date(r.timestamp);
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    });
                    setScansThisMonth(thisMonth.length);
                }
            } catch (error) {
                console.error('Failed to fetch history for dashboard', error);
            }
        };
        fetchStats();
    }, []);

    // Season info
    const seasonInfo = React.useMemo(() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        let name = 'Rabi';
        let start = new Date(year, 9, 1);
        if (month >= 5 && month <= 8) { name = 'Kharif'; start = new Date(year, 5, 1); }
        else if (month >= 2 && month <= 4) { name = 'Zaid'; start = new Date(year, 2, 1); }
        else { name = 'Rabi'; start = month <= 1 ? new Date(year - 1, 9, 1) : new Date(year, 9, 1); }
        const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return { name, days };
    }, []);

    const apps = [
        {
            id: 'scanner',
            title: t('app_scanner_title', 'Crop Scanner'),
            desc: t('app_scanner_desc', 'AI-powered disease diagnosis'),
            data: lastScanDate ? { label: t('last_diagnosis', 'Last Scan'), value: lastScanDate } : undefined,
            actionLabel: t('action_scan', 'Start Diagnosis'),
            icon: Scan,
            action: () => navigate(buildDiagnosisRoute()),
            status: 'Active',
            isFlagship: true
        },
        {
            id: 'agritwin',
            title: t('app_agritwin_title', 'Farm Simulator'),
            desc: t('app_agritwin_desc', 'Risk-free farming simulator'),
            actionLabel: t('action_simulate', 'Simulate Farm'),
            icon: AgriTwinMark,
            action: () => navigate('/simulator'),
            status: 'Active',
            isFlagship: false
        },
        {
            id: 'seed-decision',
            title: t('seed_decision_title', 'Seed Decision Engine'),
            desc: t('seed_decision_desc', 'Pre-sowing risk scoring with weather-aware inputs'),
            actionLabel: t('action_seed', 'Assess Seed Risk'),
            icon: Sprout,
            action: () => navigate(buildSeedDecisionRoute()),
            status: 'Active',
            isFlagship: false
        },
        {
            id: 'bioprospector',
            title: t('app_bio_title', 'Weed Analyzer'),
            desc: t('app_bio_desc', 'Identify medicinal value in weeds'),
            actionLabel: t('action_discover', 'Analyze Weeds'),
            icon: Sprout,
            action: () => navigate(buildDiagnosisRoute('bioprospector')),
            status: 'Active',
            isFlagship: false
        },
        {
            id: 'market',
            title: t('app_market_title', 'AgriWise Crop Advisor'),
            desc: t('app_market_desc', 'Real-time market intelligence + weather-based crop ranking'),
            actionLabel: t('action_market', 'Plan Crop Choices'),
            icon: TrendingUp,
            action: () => navigate('/market'),
            status: 'Active',
            isFlagship: false
        }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2rem] p-6 md:p-10 text-white shadow-2xl group bg-[#022c22]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#047857] opacity-95 z-0" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50 backdrop-blur-md mb-4 shadow-inner">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                        <span className="text-[10px] font-bold tracking-widest text-emerald-100 uppercase font-mono">
                            {t('system_active', 'System Active')}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight text-white drop-shadow-sm">
                        {t('dashboard_welcome', 'Welcome, Farmer')}
                        <span className="text-amber-400">.</span>
                    </h1>

                    <p className="text-emerald-100/80 text-lg font-medium leading-relaxed max-w-2xl pl-1">
                        {t('dashboard_subtitle', 'Your integrated command center for farm management, resilience, and growth.')}
                    </p>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <Activity className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {t('scans_this_month', 'Scans This Month')}
                        </span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                        {scansThisMonth}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">
                        {scansThisMonth === 0 ? t('no_scans_yet', 'No scans yet') : t('scans_recorded', 'recorded')}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {t('last_diagnosis', 'Last Diagnosis')}
                        </span>
                    </div>
                    <p className="text-sm font-black text-gray-900 leading-tight mt-1">
                        {lastScanDate ?? t('no_scans_yet', 'No scans yet')}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-amber-500">
                        <CalendarDays className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {t('season_day', 'Season Day')}
                        </span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                        {seasonInfo.days}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">{seasonInfo.name}</p>
                </div>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apps.map((app) => (
                    <button
                        key={app.id}
                        onClick={app.action}
                        className={`
                            relative rounded-[2rem] border transition-all duration-200 cursor-pointer group flex flex-col justify-between overflow-hidden text-left
                            ${app.isFlagship
                                ? 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#064e3b] to-[#047857] border-emerald-800 shadow-xl'
                                : 'bg-white border-emerald-100 shadow-sm hover:shadow-xl hover:border-emerald-400'
                            }
                            active:scale-[0.98]
                        `}
                    >
                        <div className="p-6 md:p-8 h-full flex flex-col relative z-10">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`
                                    p-3 rounded-xl flex items-center justify-center shadow-md
                                    ${app.isFlagship ? 'bg-emerald-900/50 text-white ring-1 ring-white/20' : 'bg-emerald-50 text-emerald-700'}
                                `}>
                                    <app.icon className="w-6 h-6" />
                                </div>

                                {app.data && (
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${app.isFlagship ? 'bg-emerald-900/30 text-emerald-100 border-emerald-500/30' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                        <span className="opacity-70 mr-1">{app.data.label}:</span>
                                        {app.data.value}
                                    </div>
                                )}

                                {app.status === 'Coming Soon' && (
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase border border-gray-200">
                                        {t('coming_soon', 'Soon')}
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 mb-6">
                                <h3 className={`font-black tracking-tight mb-1 ${app.isFlagship ? 'text-3xl text-white' : 'text-xl text-gray-900 group-hover:text-emerald-900'}`}>
                                    {app.title}
                                </h3>
                                <p className={`font-medium ${app.isFlagship ? 'text-emerald-100/80 text-lg' : 'text-gray-500 text-sm'}`}>
                                    {app.desc}
                                </p>
                            </div>

                            {/* CTA */}
                            {app.status === 'Active' && (
                                <div className={`
                                    w-full py-4 px-6 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-between
                                    ${app.isFlagship
                                        ? 'bg-amber-400 text-emerald-950 shadow-lg'
                                        : 'bg-emerald-50 text-emerald-800 border-2 border-transparent group-hover:border-emerald-200'
                                    }
                                `}>
                                    {app.actionLabel}
                                    <ArrowRight className={`w-5 h-5 ${app.isFlagship ? 'stroke-[3px]' : ''}`} />
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
