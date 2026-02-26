import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Pause, Play, Loader2, ChevronDown, ChevronUp, Headphones } from 'lucide-react';
import { AssessmentData } from '../types';
import { generateSpeech } from '../services/ttsService';

// ── Language display names ──────────────────────────────────────────────────
const LANG_NAMES: Record<string, string> = {
    en: 'English', hi: 'हिंदी', te: 'తెలుగు', ta: 'தமிழ்',
    ml: 'മലയാളം', kn: 'ಕನ್ನಡ', mr: 'मराठी', bn: 'বাংলা',
    gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ',
};

// ── Build a farmer-friendly plain-text summary from AssessmentData ──────────
function buildSummaryText(data: AssessmentData, t: (key: string, opts?: Record<string, string>) => string): string {
    const parts: string[] = [];

    // Crop name
    const cropName = data.bioProspectorResult?.plant_name;
    if (cropName) {
        parts.push(`${t('voice_crop_identified', { defaultValue: 'Crop identified' })}: ${cropName}.`);
    }

    // Decision
    const decision = data.arbitrationResult?.decision;
    if (decision) {
        parts.push(`${t('voice_diagnosis', { defaultValue: 'Diagnosis result' })}: ${decision}.`);
    }

    // Confidence
    const confidence = data.arbitrationResult?.confidence;
    if (confidence != null) {
        parts.push(`${t('voice_confidence', { defaultValue: 'Confidence level' })}: ${Math.round(confidence * 100)}%.`);
    }

    // Summary from explanation
    if (data.explanation?.summary) {
        // Strip markdown formatting for voice
        const cleanSummary = data.explanation.summary
            .replace(/[#*_`~>]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, ' ')
            .trim();
        parts.push(cleanSummary);
    }

    // Guidance steps
    if (data.explanation?.guidance?.length) {
        parts.push(`${t('voice_steps', { defaultValue: 'Recommended steps' })}:`);
        data.explanation.guidance.forEach((step, i) => {
            const cleanStep = step
                .replace(/[#*_`~>]/g, '')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/\n/g, ' ')
                .trim();
            parts.push(`${i + 1}. ${cleanStep}`);
        });
    }

    return parts.join(' ');
}

// ── Wave visualizer bars ────────────────────────────────────────────────────
const WaveBars = ({ active }: { active: boolean }) => (
    <div className="flex items-end gap-[3px] h-6">
        {[0, 1, 2, 3, 4].map(i => (
            <motion.div
                key={i}
                className="w-[3px] rounded-full bg-gradient-to-t from-emerald-500 to-teal-400"
                animate={active
                    ? { height: [6, 16 + (i * 2), 8, 20 + ((4 - i) * 2), 6], opacity: 1 } // Pure function, no Math.random()
                    : { height: 6, opacity: 0.3 }
                }
                transition={active
                    ? { repeat: Infinity, duration: 0.8 + i * 0.15, ease: 'easeInOut' }
                    : { duration: 0.3 }
                }
            />
        ))}
    </div>
);

// ── Progress bar ────────────────────────────────────────────────────────────
const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-3">
        <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
        />
    </div>
);

interface VoiceSummaryProps {
    data: AssessmentData;
}

export function VoiceSummary({ data }: VoiceSummaryProps) {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    // Audio state
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [expanded, setExpanded] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Build summary text
    const summaryText = useMemo(() => buildSummaryText(data, t), [data, t]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Reset audio when language changes
    useEffect(() => {
        stopAudio();
    }, [currentLang]);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPlaying(false);
        setProgress(0);
    }, []);

    const startProgressTracking = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            if (audioRef.current && audioRef.current.duration > 0) {
                setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
            }
        }, 100);
    }, []);

    const handlePlay = useCallback(async () => {
        // If already playing, pause
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        // If we have a paused audio, resume
        if (audioRef.current && audioRef.current.currentTime > 0 && audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
            startProgressTracking();
            return;
        }

        // Generate new audio
        setIsLoading(true);
        setError(null);
        setProgress(0);

        try {
            const blob = await generateSpeech(summaryText);
            const url = URL.createObjectURL(blob);

            // Clean up previous
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = url;

            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => {
                setIsPlaying(false);
                setProgress(100);
                if (intervalRef.current) clearInterval(intervalRef.current);
            };

            audio.onerror = () => {
                setIsPlaying(false);
                setError(t('voice_error', { defaultValue: 'Audio playback failed. Please try again.' }));
            };

            await audio.play();
            setIsPlaying(true);
            startProgressTracking();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            if (msg.includes('500') || msg.includes('Token')) {
                setError(t('voice_unavailable', { defaultValue: 'Voice service is currently unavailable. Please read the summary below.' }));
            } else {
                setError(t('voice_error', { defaultValue: 'Could not generate voice. Please try again.' }));
            }
            console.error('TTS error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isPlaying, summaryText, t, startProgressTracking]);

    // Don't render if there's nothing to summarize
    if (!data.arbitrationResult?.decision) return null;

    const langName = LANG_NAMES[currentLang] || currentLang;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-5 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Headphones className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                {t('voice_summary_title', { defaultValue: 'Voice Summary' })}
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">
                                    {langName}
                                </span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {t('voice_summary_desc', { defaultValue: 'Listen to your diagnosis summary' })}
                            </p>
                        </div>
                    </div>

                    <WaveBars active={isPlaying} />
                </div>

                {/* Play Controls */}
                <div className="mt-4 flex items-center gap-3">
                    <button
                        onClick={handlePlay}
                        disabled={isLoading}
                        className={`
                            flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200
                            ${isPlaying
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-md'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
                        `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('voice_generating', { defaultValue: 'Generating...' })}
                            </>
                        ) : isPlaying ? (
                            <>
                                <Pause className="w-4 h-4" />
                                {t('voice_pause', { defaultValue: 'Pause' })}
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                {t('voice_listen', { defaultValue: 'Listen' })}
                            </>
                        )}
                    </button>

                    {(isPlaying || progress > 0) && (
                        <button
                            onClick={stopAudio}
                            className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                            title={t('voice_stop', { defaultValue: 'Stop' })}
                        >
                            <VolumeX className="w-4 h-4 text-gray-600" />
                        </button>
                    )}

                    {/* Read Summary toggle */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <Volume2 className="w-3.5 h-3.5" />
                        {expanded
                            ? t('voice_hide_text', { defaultValue: 'Hide text' })
                            : t('voice_show_text', { defaultValue: 'Read summary' })
                        }
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>

                {/* Progress bar */}
                {(isPlaying || progress > 0) && <ProgressBar progress={progress} />}

                {/* Error state */}
                {error && (
                    <div className="mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                        <VolumeX className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            {/* Expandable text summary */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
                                {summaryText}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
