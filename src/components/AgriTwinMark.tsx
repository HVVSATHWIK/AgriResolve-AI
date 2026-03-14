import React from 'react';

export type AgriTwinMarkProps = React.SVGProps<SVGSVGElement>;

export const AgriTwinMark: React.FC<AgriTwinMarkProps> = ({
    className,
    ...props
}) => {
    const fieldGradientId = React.useId().replace(/:/g, '');
    const frameGradientId = React.useId().replace(/:/g, '');

    return (
        <svg
            viewBox="0 0 64 64"
            fill="none"
            className={className}
            aria-hidden={props['aria-label'] ? undefined : true}
            {...props}
        >
            <defs>
                <linearGradient id={fieldGradientId} x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0f3d2e" />
                    <stop offset="55%" stopColor="#14532d" />
                    <stop offset="100%" stopColor="#083344" />
                </linearGradient>
                <linearGradient id={frameGradientId} x1="14" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#5eead4" />
                    <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
            </defs>

            <rect x="7" y="7" width="50" height="50" rx="16" fill={`url(#${fieldGradientId})`} />
            <path d="M18 44c4-2.7 8.6-4 14-4 5.3 0 10 1.3 14 4" stroke="#9ae6b4" strokeWidth="2.3" strokeLinecap="round" />
            <path d="M18.5 49c3.7-1.7 8.2-2.6 13.5-2.6 5.2 0 9.7.9 13.5 2.6" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

            <path d="M32 16.5v23.5" stroke="#fde68a" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M31.8 21c-3.8 1-6.3 3.3-7.7 6.5 3.6-.2 6-1.5 7.7-4.2" fill="#86efac" />
            <path d="M32.2 24c3.2.8 5.5 2.8 6.8 5.6-3.2-.2-5.2-1.4-6.8-3.5" fill="#bbf7d0" />
            <path d="M31.8 27.8c-3.4 1-5.8 3.1-7.1 5.9 3.2-.2 5.5-1.3 7.1-3.7" fill="#86efac" />
            <path d="M32.2 31c3 .8 5.2 2.4 6.4 5-3-.2-5-1.2-6.4-3.2" fill="#bbf7d0" />
            <path d="M31.8 34.4c-2.8.8-4.8 2.3-5.9 4.4 2.6-.2 4.4-1.1 5.9-2.7" fill="#facc15" />

            <path d="M14.5 22.5c3.3-5.7 9.1-9.4 15.8-10" stroke={`url(#${frameGradientId})`} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M49.5 23c-1.8-3.2-4.5-5.9-7.7-7.6" stroke={`url(#${frameGradientId})`} strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="47.5" cy="22.5" r="2.2" fill="#67e8f9" />
            <circle cx="22" cy="17" r="1.7" fill="#facc15" />
        </svg>
    );
};
