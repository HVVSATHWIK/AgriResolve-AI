/**
 * API Client for Direct Client-Side Gemini Access
 * 
 * SIMPLIFIED IMPLEMENTATION: DIRECT API CALLS
 * Feature: client-side-simplicity
 */

import { GoogleGenAI } from '@google/genai';

/**
 * API response structure (kept compatible with existing frontend code)
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  result: T;
  timestamp: string;
}

/**
 * Analysis request parameters
 */
export interface AnalysisRequest {
  taskType: 'VISION_FAST' | 'GENERATE_JSON' | 'CHAT_INTERACTIVE';
  prompt: string;
  image?: string;
  manualWeather?: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
  };
}

// Initialize Gemini Client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_SERVICE_TOKEN || process.env.GEMINI_SERVICE_TOKEN;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Call Gemini API directly from the client
 */
export async function callAnalysisAPI<T = unknown>(
  request: AnalysisRequest
): Promise<ApiResponse<T>> {

  if (!genAI) {
    if (!genAI) {
      throw new Error('GEMINI_SERVICE_TOKEN is missing. Please add it to your Environment Variables.');
    }
  }

  // Model strategy: User explicitly requested '2.5 flash lite'.
  // We prioritize it, but keep stable fallbacks (2.0-flash-lite, 1.5-flash) in case it returns 404.
  const MODELS_TO_TRY = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite-preview-02-05', 'gemini-1.5-flash'];

  // Retry configuration
  const MAX_RETRIES_PER_MODEL = 2; // 2 retries = 3 attempts total per model
  const BASE_DELAY = 1000; // Start with 1s

  let lastError: Error | null = null;

  for (const modelId of MODELS_TO_TRY) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`[Gemini API] Attempting ${request.taskType} with ${modelId} (Attempt ${attempt + 1}/${MAX_RETRIES_PER_MODEL + 1})`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [{ text: request.prompt }];

        if (request.image) {
          // Remove data:image/...;base64, prefix if present for the SDK
          const base64Data = request.image.includes(',')
            ? request.image.split(',')[1]
            : request.image;

          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          });
        }

        // Call the API using the correct SDK method
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config: any = {
          maxOutputTokens: 1400,
          temperature: 0.2,
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
          ]
        };

        if (request.taskType === 'GENERATE_JSON') {
          config.responseMimeType = 'application/json';
        }

        const response = await genAI.models.generateContent({
          model: modelId,
          contents: [{ parts }],
          config
        });

        let text = response.text || '';

        // Clean up JSON if requested
        if (request.taskType === 'GENERATE_JSON') {
          text = text.replace(/```json\n?|\n?```/g, '').trim();
        }

        // Attempt to parse JSON result
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsedResult: any = text;
        try {
          if (request.taskType === 'GENERATE_JSON' || (text.startsWith('{') && text.endsWith('}'))) {
            parsedResult = JSON.parse(text);
          }
        } catch {
          // failed to parse, keep as text
        }

        return {
          success: true,
          result: parsedResult as T,
          timestamp: new Date().toISOString()
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        lastError = error;

        // Check for 429 (Resource Exhausted) or 503 (Service Unavailable)
        const isTransientError = error.message?.includes('429') ||
          error.status === 429 ||
          error.message?.includes('quota') ||
          error.message?.includes('RESOURCE_EXHAUSTED') ||
          error.status === 503;

        if (isTransientError) {
          if (attempt < MAX_RETRIES_PER_MODEL) {
            // Exponential backoff with jitter: 2^attempt * BASE_DELAY + random jitter
            const delay = Math.min((Math.pow(2, attempt) * BASE_DELAY) + (Math.random() * 500), 10000);

            console.warn(`[Gemini API] Transient error (${modelId}). Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry same model
          } else {
            console.warn(`[Gemini API] Exhausted retries for ${modelId}. Switching to fallback...`);
            // Break inner loop to try next model
            break;
          }
        } else {
          // Non-retriable error (e.g., 400 Bad Request, 401 Unauthorized)
          console.error(`[Gemini API] Fatal error with ${modelId}:`, error);
          throw error; // Fail immediately for non-transient errors
        }
      }
    }
  }

  // If we get here, all models failed
  console.error('[Gemini API] All models and retries failed.');
  throw lastError || new Error('All, Gemini models failed to respond.');
}

/**
 * Mock health checks since we have no backend
 */
export async function checkAPIHealth(): Promise<{ status: string }> {
  return { status: 'healthy' };
}
export async function checkServiceHealth(service: string): Promise<{ service: string; available: boolean; message: string }> {
  return { service, available: true, message: 'Client-side only' };
}
