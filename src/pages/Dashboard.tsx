import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FeatureIcon } from '../components/FeatureIcon';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const apps = [
        {
            id: 'scanner',
            title: t('app_scanner_title', 'Crop Scanner'),
            desc: t('app_scanner_desc', 'AI-powered disease diagnosis'),
            iconType: 'SCANNER' as const,
            color: 'bg-green-50 text-green-600 border-green-100',
            action: () => navigate('/diagnosis'),
            status: 'Active'
        },
        {
            id: 'agritwin',
            title: t('app_agritwin_title', 'Agri-Twin'),
            desc: t('app_agritwin_desc', 'Risk-free farming simulator'),
            iconType: 'AGRITWIN' as const,
            color: 'bg-blue-50 text-blue-600 border-blue-100',
            action: () => navigate('/simulator'),
            status: 'Active'
        },
        {
            id: 'bioprospector',
            title: t('app_bio_title', 'Bio-Prospector'),
            desc: t('app_bio_desc', 'Discover hidden value in weeds'),
            iconType: 'BIOPROSPECTOR' as const,
            color: 'bg-purple-50 text-purple-600 border-purple-100',
            action: () => navigate('/diagnosis?mode=bioprospector'), // Integrated into Scanner
            status: 'Active'
        },
        {
            id: 'market',
            title: t('app_market_title', 'Market Pulse'),
            desc: t('app_market_desc', 'Real-time prices & cooperative selling'),
            iconType: 'MARKET' as const,
            color: 'bg-orange-50 text-orange-600 border-orange-100',
            action: () => navigate('/market'),
            status: 'Active'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-white shadow-2xl transition-all hover:shadow-green-900/20 group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-800 dark:from-green-900 dark:to-emerald-950 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 z-0"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
                        {t('dashboard_welcome', 'Welcome, Farmer')}
                    </h1>
                    <p className="text-green-50 text-lg md:text-xl font-medium max-w-2xl leading-relaxed opacity-90">
                        {t('dashboard_subtitle', 'Your integrated command center for farm management, resilience, and growth.')}
                    </p>
                </div>
                {/* Decorative Circle */}
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {apps.map((app) => (
                    <div
                        key={app.id}
                        onClick={app.action}
                        className={`
                            relative p-8 rounded-3xl border transition-all cursor-pointer group overflow-hidden
                            ${app.status === 'Coming Soon'
                                ? 'bg-white/40 dark:bg-black/40 border-white/20 dark:border-white/10 opacity-70 grayscale-[0.5]'
                                : 'bg-white/60 dark:bg-black/60 backdrop-blur-xl border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/80 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-900/5'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${app.color} group-hover:scale-110 transition-transform duration-300`}>
                                <FeatureIcon type={app.iconType} className="w-9 h-9" />
                            </div>
                            {app.status === 'Coming Soon' && (
                                <span className="bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur text-gray-600 dark:text-gray-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                                    Coming Soon
                                </span>
                            )}
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight group-hover:text-green-800 dark:group-hover:text-green-400 transition-colors">
                            {app.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 font-medium mb-6 leading-relaxed">
                            {app.desc}
                        </p>

                        {app.status === 'Active' && (
                            <div className="flex items-center text-green-700 dark:text-green-400 font-bold group-hover:gap-3 transition-all">
                                <span className="text-sm uppercase tracking-wider border-b-2 border-green-700/20 dark:border-green-400/20 group-hover:border-green-700 dark:group-hover:border-green-400 pb-0.5">
                                    {t('open_app', 'Open App')}
                                </span>
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
