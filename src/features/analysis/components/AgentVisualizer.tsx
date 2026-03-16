import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Eye, ShieldCheck, Scale, FileText } from 'lucide-react';
import { AssessmentStatus } from '../../../types';
import { cn } from '../../../lib/utils';

interface AgentVisualizerProps {
    status: AssessmentStatus;
}

const AGENTS = [
    {
        id: AssessmentStatus.PERCEIVING,
        label: "Vision Systems",
        icon: Eye,
        color: "bg-blue-500",
        desc: "Scanning visual features..."
    },
    {
        id: AssessmentStatus.EVALUATING,
        label: "Quality Control",
        icon: ShieldCheck,
        color: "bg-purple-500",
        desc: "Verifying image integrity..."
    },
    {
        id: AssessmentStatus.DEBATING,
        label: "Hypothesis Debate",
        icon: Leaf,
        color: "bg-orange-500",
        desc: "Generative adversarial analysis..."
    },
    {
        id: AssessmentStatus.ARBITRATING,
        label: "Arbitration",
        icon: Scale,
        color: "bg-red-500",
        desc: "Weighing evidence & conflicts..."
    },
    {
        id: AssessmentStatus.EXPLAINING,
        label: "Explanation",
        icon: FileText,
        color: "bg-green-500",
        desc: "Synthesizing farmer guidance..."
    }
];

// Helper to map current status to active index (0 to 4)
const getActiveIndex = (status: AssessmentStatus) => {
    const order = [
        AssessmentStatus.PERCEIVING,
        AssessmentStatus.EVALUATING,
        AssessmentStatus.DEBATING,
        AssessmentStatus.ARBITRATING,
        AssessmentStatus.EXPLAINING,
        AssessmentStatus.COMPLETED
    ];

    // Find where the current status is in the pipeline
    const index = order.indexOf(status);

    // If completed, return length (all active/done)
    if (status === AssessmentStatus.COMPLETED) return 5;

    // If not found (e.g. IDLE/UPLOADING), return -1
    return index;
};

import { useTranslation } from 'react-i18next';

export const AgentVisualizer: React.FC<AgentVisualizerProps> = ({ status }) => {
    const { t } = useTranslation();
    const activeIndex = getActiveIndex(status);

    // Use manual mapping for translations to ensure type safety


    // Actually, better to just map manually or use keys in the AGENTS array constant?
    // Let's redefine the hook to map the static array inside.

    // ... redefining standard logic below ...

    const translatedAgents = [
        { ...AGENTS[0], label: t('agent_vision') },
        { ...AGENTS[1], label: t('agent_quality') },
        { ...AGENTS[2], label: t('agent_debate') },
        { ...AGENTS[3], label: t('agent_arbitration') },
        { ...AGENTS[4], label: t('agent_explanation') },
    ];

    const activeAgent = activeIndex >= 0 && activeIndex < translatedAgents.length
        ? translatedAgents[activeIndex]
        : null;

    if (status === AssessmentStatus.IDLE || status === AssessmentStatus.ERROR) return null;

    return (
        <div className="w-full py-4 relative pb-12">

            <div className="md:hidden mb-3 px-2">
                <div className="text-[11px] font-semibold text-gray-600">
                    {activeAgent ? `Current: ${activeAgent.label}` : 'Current: Preparing analysis'}
                </div>
            </div>

            <div className="md:hidden flex gap-3 overflow-x-auto px-2 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {translatedAgents.map((agent, index) => {
                    const isActive = index === activeIndex;
                    const isCompleted = index < activeIndex;

                    return (
                        <div key={agent.id} className="snap-start min-w-[96px] max-w-[96px] flex-shrink-0 flex flex-col items-center text-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0.6 }}
                                animate={{
                                    scale: isActive ? 1.06 : 1,
                                    opacity: isActive || isCompleted ? 1 : 0.45,
                                }}
                                className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center border-[1.5px] transition-colors duration-500",
                                    isActive ? "border-green-500 bg-green-50 text-green-600" :
                                        isCompleted ? "border-green-500 bg-green-500 text-white" :
                                            "border-gray-200 bg-gray-50 text-gray-300"
                                )}
                            >
                                <agent.icon className="w-5 h-5" strokeWidth={1.75} />
                            </motion.div>

                            <span className={cn(
                                "mt-2 text-[10px] leading-tight font-bold tracking-wide break-words",
                                isActive ? "text-green-700" : isCompleted ? "text-green-600" : "text-gray-500"
                            )}>
                                {agent.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="hidden md:flex items-start justify-between w-full relative z-10 px-2 lg:px-8">
                {translatedAgents.map((agent, index) => {
                    // Current step is active if index matches activeIndex
                    const isActive = index === activeIndex;
                    // Step is completed if index is less than activeIndex
                    const isCompleted = index < activeIndex;

                    return (
                        <React.Fragment key={agent.id}>
                            {/* Agent Node */}
                            <div className="group flex flex-col items-center relative z-20 w-12 md:w-16 flex-shrink-0">
                                {/* Icon Circle */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0.5 }}
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        opacity: isActive || isCompleted ? 1 : 0.4,
                                        backgroundColor: isActive || isCompleted ? 'var(--bg-color)' : '#f3f4f6',
                                        boxShadow: isActive ? "0 4px 12px -2px rgba(0,0,0,0.1)" : "none"
                                    }}
                                    style={{ '--bg-color': isCompleted ? '#16a34a' : '#ffffff' } as React.CSSProperties}
                                    className={cn(
                                        "w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-colors duration-500 border-[1.5px] relative z-30",
                                        isActive ? "border-green-500 bg-green-50 text-green-600" :
                                            isCompleted ? "border-green-500 bg-green-500 text-white" :
                                                "border-gray-100 bg-gray-50 text-gray-300"
                                    )}
                                >
                                    <agent.icon className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.5} />

                                    {/* Pulse Ring for Active */}
                                    {isActive && (
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl border-2 border-green-500"
                                            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        />
                                    )}
                                </motion.div>

                                {/* Text Label - Absolute Positioned & Constrained Width */}
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[120px] text-center pointer-events-none z-40">
                                    <span className={cn(
                                        "block text-[9px] font-bold uppercase tracking-wide leading-tight transition-colors duration-300 break-words",
                                        isActive ? "text-green-600" : isCompleted ? "text-green-700" : "text-gray-300"
                                    )}>
                                        {agent.label}
                                    </span>

                                    {/* Active State Description */}
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1"
                                        >
                                            <span className="text-[9px] text-green-500 font-medium bg-white/90 px-2 py-0.5 rounded-full shadow-sm border border-green-100 whitespace-nowrap">
                                                {agent.desc}
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < AGENTS.length - 1 && (
                                <div className="flex-1 h-[2px] bg-gray-200/50 mt-6 md:mt-8 relative -mx-2 md:-mx-4 z-0 rounded-full overflow-hidden self-start">
                                    <motion.div
                                        className="h-full bg-green-500 relative"
                                        initial={{ width: "0%" }}
                                        animate={{ width: isCompleted ? "100%" : "0%" }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                    >
                                        {/* Data Flow Particle Effect */}
                                        {isCompleted && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent w-20 transform -skew-x-12"
                                                animate={{ x: ["-100%", "500%"] }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            />
                                        )}
                                    </motion.div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
