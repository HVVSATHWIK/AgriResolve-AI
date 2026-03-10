import React, { useState, useEffect, useRef } from 'react';
import { HistorySidebar } from '../features/history/components/HistorySidebar';
import { CropAnalysisRecord } from '../features/history/types';
import { Plus, Sun, ChevronDown, ChevronRight, History, Menu, X, LayoutGrid, LogOut, MapPin } from 'lucide-react';
import { InsightsDashboard } from '../features/assistant/components/InsightsDashboard';
import { useLocationWeather } from '../features/assistant/hooks/useLocationWeather';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  history?: CropAnalysisRecord[];
  onSelectHistory?: (record: CropAnalysisRecord) => void;
  onNewAnalysis?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, history = [], onSelectHistory = () => { }, onNewAnalysis }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { locationName, requestPermission, consent } = useLocationWeather();
  const [showHistory, setShowHistory] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, signOut } = useAuth();
  const mainRef = useRef<HTMLElement>(null);

  // Scroll main content to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // V4.1: Real Season Logic (Reality Check)
  const seasonInfo = React.useMemo(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();

    let name = 'Rabi';
    let start = new Date(year, 9, 1); // Default Oct 1

    // Kharif: June (5) - Sept (8)
    // Rabi: Oct (9) - Feb (1)
    // Zaid: March (2) - May (4)

    if (month >= 5 && month <= 8) {
      name = 'Kharif';
      start = new Date(year, 5, 1); // June 1
    } else if (month >= 2 && month <= 4) {
      name = 'Zaid';
      start = new Date(year, 2, 1); // March 1
    } else {
      name = 'Rabi';
      // If Jan(0) or Feb(1), season started previous year
      if (month <= 1) {
        start = new Date(year - 1, 9, 1); // Oct 1 Prev Year
      } else {
        start = new Date(year, 9, 1); // Oct 1 Current Year
      }
    }

    const diff = now.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return { name, start, days, year: start.getFullYear() };
  }, []);


  return (
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row font-inter relative overflow-x-hidden md:overflow-hidden bg-[#f0f4f2]">

      {/* Content Wrapper */}
      <div className="relative z-0 flex flex-col md:flex-row w-full md:h-screen">

        {/* Mobile Header (Visible only on small screens) */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm safe-area-inset-top shrink-0">
          <div className="flex items-center gap-2" onClick={() => navigate('/')}>
            <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-100 overflow-hidden">
              <img src="/logo.png" alt="AgriResolve" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-sm font-black text-gray-900 tracking-tight">{t('brand_name', { defaultValue: 'AgriResolve AI' })}</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Overlay Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SIDEBAR — h-screen flex flex-col
            ┌─────────────────────┐
            │  Header (shrink-0)  │
            ├─────────────────────┤
            │                     │
            │  Scrollable Content │ ← flex-1 overflow-y-auto
            │  (Nav, Season)      │
            │                     │
            ├─────────────────────┤
            │  Bottom Pinned      │ ← mt-auto shrink-0
            │  (Insights, User,   │
            │   Copyright)        │
            └─────────────────────┘
        ═══════════════════════════════════════════════════════════════ */}
        <aside className={`
          fixed md:sticky top-0 left-0 h-screen w-[280px] md:w-80 bg-white border-r border-gray-200
          text-gray-900 flex flex-col shadow-2xl md:shadow-none z-50 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>

          {/* ── Header & Identity (fixed at top) ── */}
          <div className="shrink-0 p-5 border-b border-gray-100 bg-white cursor-pointer relative" onClick={() => navigate('/')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <img src="/logo.png" alt="AgriResolve Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-black text-emerald-950 tracking-tight leading-none">{t('brand_name', { defaultValue: 'AgriResolve' })}</h1>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Field Assistant</span>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="md:hidden absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Scrollable Middle Section ── */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 px-4 py-5 space-y-6">

            {/* Navigation */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Navigation</h3>

              <button
                onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${location.pathname === '/' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-100' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm">{t('nav_home', 'Hub')}</span>
              </button>

              <button
                onClick={() => {
                  if (onNewAnalysis) onNewAnalysis();
                  navigate('/diagnosis');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${location.pathname === '/diagnosis' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-100' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">{t('new_scan', { defaultValue: 'New Analysis' })}</span>
              </button>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                if (onNewAnalysis) onNewAnalysis();
                navigate('/diagnosis');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-emerald-950 hover:bg-emerald-900 text-white p-3 rounded-xl shadow-lg shadow-emerald-900/10 transition-all active:scale-95 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-bold text-sm tracking-wide">{t('new_scan', { defaultValue: 'New Analysis' })}</span>
            </button>

            {/* Current Season */}
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Current Season</h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-gray-800">{seasonInfo.name} {seasonInfo.year}</h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                    <Sun className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700">
                      {new Date().toLocaleDateString(i18n.language || undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden flex mb-2">
                  <div className="bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((seasonInfo.days / 120) * 100, 100)}%` }} />
                </div>

                <div className="flex justify-between text-[10px] font-medium text-gray-400">
                  <span>Sowing</span>
                  <span className="text-emerald-700 font-bold">Day {seasonInfo.days}</span>
                  <span>Harvest</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {t('field_monitor', { defaultValue: 'AI Insights' })}
                </h2>
                {consent !== 'granted' && (
                  <button
                    onClick={() => requestPermission()}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    {t('enable', { defaultValue: 'Enable' })}
                  </button>
                )}
              </div>

              {consent === 'granted' && locationName?.displayName ? (
                <InsightsDashboard locationName={locationName.displayName} />
              ) : (
                <button
                  onClick={() => requestPermission()}
                  className="w-full text-center p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-emerald-50 hover:border-emerald-100 transition-colors group cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 mx-auto mb-1.5 transition-colors" />
                  <p className="text-[11px] text-gray-400 group-hover:text-emerald-700 font-medium transition-colors">
                    {t('enable_loc_msg', { defaultValue: 'Enable location for local insights' })}
                  </p>
                </button>
              )}
            </div>

            {/* History (Collapsible) */}
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2 text-gray-500 group-hover:text-emerald-900">
                  <History className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('history_header', 'History')}</span>
                </div>
                {showHistory ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
              </button>

              {showHistory && (
                <div className="mt-2 pl-2 border-l-2 border-gray-100 animate-in slide-in-from-top-2 fade-in">
                  <HistorySidebar
                    history={history}
                    onSelect={(r) => {
                      onSelectHistory(r);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

          </div>

          {/* ── Bottom Pinned Section ── */}
          <div className="shrink-0 border-t border-gray-100 bg-white">
            {currentUser && (
              <div className="px-3 pt-3 pb-2">
                <div className="group rounded-xl p-2.5 flex items-center gap-3 hover:bg-gray-50 transition-all duration-200 cursor-default">
                  {/* Avatar with online indicator */}
                  <div className="relative shrink-0">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-100 ring-offset-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-emerald-100 ring-offset-1">
                        {(currentUser.displayName ?? currentUser.email ?? 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {/* Online status dot */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate leading-tight">
                      {currentUser.displayName ?? currentUser.email?.split('@')[0]}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                      {currentUser.email}
                    </p>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      signOut().then(() => navigate('/login'));
                    }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 shrink-0"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {/* Copyright */}
            <div className="px-4 py-2 text-center border-t border-gray-50">
              <p className="text-[10px] text-gray-300 font-medium tracking-wide">© 2026 AgriResolve AI</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative bg-transparent pt-20 md:pt-6 pb-24 md:pb-8 safe-area-inset-top safe-area-inset-bottom">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
