import React from 'react';
import { LogOut, Globe, X, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

interface UserProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserProfileSheet: React.FC<UserProfileSheetProps> = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const { currentUser, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await signOut();
            onClose();
            navigate('/login');
        } catch (e) {
            console.error(e);
        }
    };

    const handleLangSelect = (code: string) => {
        i18n.changeLanguage(code);
    };

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <h2 className="text-base font-black text-gray-900 tracking-tight">
                                {t('account', 'Account')}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-5 py-4 space-y-5 max-h-[80vh] overflow-y-auto">
                            {/* User Card */}
                            {currentUser && (
                                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="relative shrink-0">
                                        {currentUser.photoURL ? (
                                            <img
                                                src={currentUser.photoURL}
                                                alt=""
                                                referrerPolicy="no-referrer"
                                                className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-200 ring-offset-2"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white font-black text-xl ring-2 ring-emerald-200 ring-offset-2">
                                                {(currentUser.displayName ?? currentUser.email ?? 'U')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base font-black text-gray-900 truncate leading-tight">
                                            {currentUser.displayName ?? currentUser.email?.split('@')[0]}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate mt-0.5 leading-tight">
                                            {currentUser.email}
                                        </p>
                                    </div>
                                    <User className="w-5 h-5 text-emerald-500 shrink-0" />
                                </div>
                            )}

                            {/* Language Section */}
                            <div>
                                <div className="flex items-center gap-2 px-1 mb-3">
                                    <Globe className="w-4 h-4 text-gray-400" />
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                        {t('language', 'Language')}
                                    </h3>
                                    <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        {currentLang.native}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLangSelect(lang.code)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                                                i18n.language === lang.code
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-emerald-200 hover:bg-emerald-50/50'
                                            }`}
                                        >
                                            <div>
                                                <div className="text-sm font-bold leading-tight">{lang.native}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{lang.label}</div>
                                            </div>
                                            {i18n.language === lang.code && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sign Out */}
                            <button
                                id="mobile-sign-out-btn"
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-black text-sm tracking-wide hover:bg-red-100 active:scale-[0.98] transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                                {t('sign_out', 'Sign Out')}
                            </button>
                        </div>

                        {/* Bottom safe-area spacer */}
                        <div className="h-4" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
