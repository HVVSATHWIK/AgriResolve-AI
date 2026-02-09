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
const apiKey = import.meta.env.VITE_GEMINI_API_TOKEN;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Call Gemini API directly from the client
 */
export async function callAnalysisAPI<T = unknown>(
  request: AnalysisRequest
): Promise<ApiResponse<T>> {

  if (!genAI) {
    throw new Error('VITE_GEMINI_API_TOKEN is missing. Please add it to your Environment Variables.');
  }

  try {
    // Select model based on task
    const modelId = request.taskType === 'VISION_FAST' ? 'gemini-2.0-flash' : 'gemini-2.0-flash';

    // Prepare contents
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
    // @google/genai v0.0.x / v1.x pattern
    const response = await genAI.models.generateContent({
      model: modelId,
      contents: [{ parts }],
      config: {
        maxOutputTokens: 1400,
        temperature: 0.2
      }
    });

    let text = response.text || '';

    // Clean up JSON if requested
    if (request.taskType === 'GENERATE_JSON') {
      text = text.replace(/```json\n?|\n?```/g, '').trim();
    }

    // Attempt to parse JSON result if the generic T implies it, or just return text
    let parsedResult: any = text;
    try {
      if (request.taskType === 'GENERATE_JSON' || (text.startsWith('{') && text.endsWith('}'))) {
        parsedResult = JSON.parse(text);
      }
    } catch (e) {
      // failed to parse, keep as text
    }

    return {
      success: true,
      result: parsedResult as T,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Failed to connect to Gemini API');
  }
}

/**
 * Mock health checks since we have no backend
 */
export async function checkAPIHealth(): Promise<{ status: string }> {
  return { status: 'healthy' };
}
export async function checkServiceHealth(service: string): Promise<any> {
  return { service, available: true, message: 'Client-side only' };
}
