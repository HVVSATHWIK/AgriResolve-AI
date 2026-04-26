import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, TrendingUp, Gamepad2, MessageSquare, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { buildAppRoute } from '../lib/navigation';

export const MobileBottomNav: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();

    const navItems = [
        { to: buildAppRoute('/', location.search), icon: LayoutGrid, label: t('nav_home', "Home") },
        { to: buildAppRoute('/chat', location.search), icon: MessageSquare, label: t('assistant_title', "Assistant") },
        { to: buildAppRoute('/market', location.search), icon: TrendingUp, label: 'AgriWise' },
        { to: buildAppRoute('/seed-decision', location.search), icon: Sprout, label: 'Seed' },
        { to: buildAppRoute('/simulator', location.search), icon: Gamepad2, label: t('nav_sim', "Twin") },
    ];

    return (
        <nav aria-label="Main navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-emerald-100 px-3 py-2 grid grid-cols-5 gap-1 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
              min-w-0 flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300
              ${isActive ? 'text-emerald-700 bg-emerald-100 shadow-sm' : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-50'}
            `}
                >
                    <item.icon className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
                    <span className="text-[9px] font-bold tracking-wider uppercase mt-1 truncate w-full text-center">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};
