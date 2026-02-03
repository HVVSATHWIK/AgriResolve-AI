/**
 * Gemini API Integration
 * 
 * DEPRECATED: Direct API calls - Use backend proxy instead
 * This file is kept for backward compatibility but routes through backend proxy
 * 
 * Feature: agricultural-accuracy-and-security-fixes
 * Requirements: 5.1, 5.2 - All calls now go through backend proxy
 */

import { callAnalysisAPI } from './apiClient';

// DEPRECATED: API key should not be in frontend
// Keeping this for backward compatibility warnings only
const rawKey = import.meta.env.VITE_GEMINI_API_TOKEN ||
    (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_TOKEN : undefined);

if (rawKey) {
    console.warn(
        '[SECURITY] VITE_GEMINI_API_TOKEN detected in frontend environment. ' +
        'This is deprecated and insecure. All API calls now route through the backend proxy. ' +
        'Please remove VITE_GEMINI_API_TOKEN from your frontend .env file.'
    );
}

// Model Registry - kept for type compatibility
const MODEL_FALLBACKS = {
    VISION_FAST: 'VISION_FAST',
    DEBATE_HIGH_THROUGHPUT: 'GENERATE_JSON',
    ARBITRATION_SMART: 'GENERATE_JSON',
    EXPLANATION_POLISHED: 'GENERATE_JSON',
    CHAT_INTERACTIVE: 'CHAT_INTERACTIVE',
    GENERATE_JSON: 'GENERATE_JSON',
} as const;

/**
 * Route Gemini call through backend proxy
 * 
 * Requirement 5.1: All Gemini API calls must go through backend proxy
 * Requirement 5.2: Never expose API keys in frontend
 * 
 * @deprecated This function now routes through the backend proxy for security
 */
export async function routeGeminiCall(
    taskType: keyof typeof MODEL_FALLBACKS,
    prompt: string,
    imageB64?: string
): Promise<string> {
    console.log(`[Gemini Service] Routing '${taskType}' through backend proxy`);

    try {
        // Map old task types to new ones
        const mappedTaskType = MODEL_FALLBACKS[taskType] as 'VISION_FAST' | 'GENERATE_JSON' | 'CHAT_INTERACTIVE';

        // Call backend proxy
        const response = await callAnalysisAPI({
            taskType: mappedTaskType,
            prompt,
            image: imageB64,
        });

        // Log degradation warnings if present
        if (response.degraded && response.limitations) {
            console.warn('[Gemini Service] Service degradation detected:', response.limitations);
        }

        // Return result as string (for backward compatibility)
        if (typeof response.result === 'string') {
            return response.result;
        }

        // If result is an object, stringify it
        return JSON.stringify(response.result);
    } catch (error) {
        console.error(`[Gemini Service] Backend proxy call failed for '${taskType}':`, error);
        throw error;
    }
}
