/**
 * API Client for Backend Proxy
 * 
 * Handles all communication with the backend API proxy
 * Feature: agricultural-accuracy-and-security-fixes
 * Requirements: 5.1, 5.2, 7.1
 */

/**
 * API response structure from backend
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  result: T;
  rateLimitInfo?: {
    quotaRemaining: number;
    quotaUsed: number;
    resetTime: string;
  };
  degraded?: boolean;
  limitations?: string[];
  serviceErrors?: Array<{
    service: string;
    available: boolean;
    message: string;
    retryable: boolean;
    retryAfter?: number;
  }>;
  manualWeatherUsed?: boolean;
  timestamp: string;
}

/**
 * API error response structure
 */
export interface ApiError {
  error: string;
  code: string;
  message: string;
  timestamp: string;
  retryable?: boolean;
  retryAfter?: number;
  serviceErrors?: Array<{
    service: string;
    available: boolean;
    message: string;
  }>;
  affectedFeatures?: string[];
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetTime: string;
    retryAfter: number;
  };
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
 * Base API URL - defaults to same origin in production
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Call the backend analysis endpoint
 * Requirement 5.1: Use backend proxy instead of direct Gemini API calls
 * Requirement 5.2: Never expose API keys in frontend
 */
export async function callAnalysisAPI<T = unknown>(
  request: AnalysisRequest
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookie
      body: JSON.stringify(request),
    });

    const data = await response.json();

    // Handle rate limiting
    // Requirement 7.1: Handle rate limit responses from backend
    if (response.status === 429) {
      const error: ApiError = data;
      throw new RateLimitError(
        error.message,
        error.rateLimitInfo?.retryAfter || 300,
        error.rateLimitInfo?.resetTime || new Date(Date.now() + 300000).toISOString()
      );
    }

    // Handle service unavailability
    if (response.status === 503) {
      const error: ApiError = data;
      throw new ServiceUnavailableError(
        error.message,
        error.serviceErrors || [],
        error.affectedFeatures || [],
        error.retryable || false,
        error.retryAfter
      );
    }

    // Handle other errors
    if (!response.ok) {
      const error: ApiError = data;
      throw new ApiClientError(
        error.message || 'API request failed',
        response.status,
        error.code,
        error.retryable || false
      );
    }

    return data as ApiResponse<T>;
  } catch (error) {
    // Re-throw custom errors
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Unable to connect to server. Please check your internet connection.');
    }

    // Unknown errors
    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      'UNKNOWN_ERROR',
      false
    );
  }
}

/**
 * Check API health
 */
export async function checkAPIHealth(): Promise<{
  status: string;
  services: {
    gemini: { available: boolean; message: string };
    weather: { available: boolean; message: string };
  };
}> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Health check failed');
  }

  return response.json();
}

/**
 * Check specific service health
 */
export async function checkServiceHealth(service: 'gemini' | 'weather'): Promise<{
  service: string;
  available: boolean;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/health/${service}`, {
    method: 'GET',
    credentials: 'include',
  });

  return response.json();
}

/**
 * Custom error classes
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public retryable: boolean
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class RateLimitError extends ApiClientError {
  constructor(
    message: string,
    public retryAfter: number,
    public resetTime: string
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends ApiClientError {
  constructor(
    message: string,
    public serviceErrors: Array<{
      service: string;
      available: boolean;
      message: string;
    }>,
    public affectedFeatures: string[],
    retryable: boolean,
    public retryAfter?: number
  ) {
    super(message, 503, 'SERVICE_UNAVAILABLE', retryable);
    this.name = 'ServiceUnavailableError';
  }
}

export class NetworkError extends ApiClientError {
  constructor(message: string) {
    super(message, 0, 'NETWORK_ERROR', true);
    this.name = 'NetworkError';
  }
}
