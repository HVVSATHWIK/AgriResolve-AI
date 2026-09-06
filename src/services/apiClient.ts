/**
 * API Client — Backend Proxy
 * 
 * All Gemini API calls are proxied through the backend server.
 * The backend holds the API key; the client never touches it.
 * Feature: security-and-architecture-compliance
 */

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

/**
 * Resolve the backend API base URL.
 * In production → VITE_API_URL (e.g. https://agriresolve-backend.onrender.com)
 * In development → empty string (Vite proxy or same-origin)
 */
const _AZURE_API_BASE = 'https://agriresolve-ai-azfferc6bff2g6gt.germanywestcentral-01.azurewebsites.net';

const resolveApiBase = (): string => {
  const raw = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
  if (raw) return raw;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalServer = host === 'localhost' || host === '127.0.0.1' || host.includes('run.app');

    // When running locally or inside full-stack Cloud Run container, use relative /api
    if (isLocalServer) {
      return '';
    }

    // On static web hostings (e.g. Firebase Hosting, Vercel), route to Azure backend API
    return _AZURE_API_BASE;
  }

  return raw;
};

const API_BASE = resolveApiBase();

async function postAnalysis(baseUrl: string, request: AnalysisRequest) {
  return fetch(`${baseUrl}/api/analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      taskType: request.taskType,
      prompt: request.prompt,
      image: request.image,
      weatherData: request.manualWeather
    }),
  });
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(`Received HTML response (${response.status}) instead of JSON. Ensure API route exists.`);
  }

  const text = await response.text();
  if (!text || text.trim().startsWith('<')) {
    throw new Error(`Invalid JSON response starting with markup (${response.status}).`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON response: ${(err as Error).message}`);
  }
}

/**
 * Call Gemini API via Backend Proxy with multi-stage fallback
 */
export async function callAnalysisAPI<T = unknown>(
  request: AnalysisRequest
): Promise<ApiResponse<T>> {
  const primaryBase = API_BASE;
  let response: Response | null = null;
  let lastError: Error | null = null;

  console.log(`[API Client] Sending ${request.taskType} request to backend at ${primaryBase || 'same-origin'}/api/analysis ...`);

  // Try Primary Target
  try {
    response = await postAnalysis(primaryBase, request);
    if (response.ok) {
      const data = await parseJsonResponse(response);
      return {
        success: true,
        result: data.data || data.result || data,
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn(`[API Client] Request to '${primaryBase || 'same-origin'}' failed:`, err);
    lastError = err as Error;
  }

  // Fallback Target: Try Azure Backend if primary was relative or failed
  if (primaryBase !== _AZURE_API_BASE) {
    try {
      console.log(`[API Client] Retrying ${request.taskType} via remote fallback endpoint ${_AZURE_API_BASE}/api/analysis ...`);
      response = await postAnalysis(_AZURE_API_BASE, request);
      if (response.ok) {
        const data = await parseJsonResponse(response);
        return {
          success: true,
          result: data.data || data.result || data,
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn(`[API Client] Azure fallback request failed:`, err);
      lastError = err as Error;
    }
  }

  // Final Fallback: Client-side direct GoogleGenAI if VITE_GEMINI_API_KEY is available
  const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (clientApiKey) {
    try {
      console.log(`[API Client] Backend proxies unavailable. Falling back to direct client-side Gemini API call.`);
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: clientApiKey });
      
      const contents: unknown[] = [request.prompt];
      if (request.image) {
        const base64Data = request.image.replace(/^data:image\/\w+;base64,/, '');
        contents.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });
      }

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents as string[]
      });

      const text = res.text || '';
      return {
        success: true,
        result: text as unknown as T,
        timestamp: new Date().toISOString()
      };
    } catch (genAiErr) {
      console.error('[API Client] Client-side direct Gemini call failed:', genAiErr);
    }
  }

  throw lastError || new Error(`Backend analysis request failed for ${request.taskType}`);
}

/**
 * Health check against the backend
 */
export async function checkAPIHealth(): Promise<{ status: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return await res.json();
  } catch {
    return { status: 'unhealthy' };
  }
}

export async function checkServiceHealth(service: string): Promise<{ service: string; available: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/health/${service}`);
    return await res.json();
  } catch {
    return { service, available: false, message: 'Health check failed' };
  }
}
