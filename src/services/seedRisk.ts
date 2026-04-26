import { config } from '../config';
import type {
  SeedRiskApiErrorDetail,
  SeedRiskApiResponse,
  SeedRiskRequest,
} from '../features/seedDecision/types';

const API_BASE = config.apiUrl || '/api';

export class SeedRiskApiError extends Error {
  status: number;

  details?: SeedRiskApiErrorDetail[];

  constructor(message: string, status: number, details?: SeedRiskApiErrorDetail[]) {
    super(message);
    this.name = 'SeedRiskApiError';
    this.status = status;
    this.details = details;
  }
}

async function postSeedRisk(baseUrl: string, request: SeedRiskRequest): Promise<Response> {
  return fetch(`${baseUrl}/seed-risk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
}

export async function callSeedRiskAPI(request: SeedRiskRequest): Promise<SeedRiskApiResponse> {
  let response = await postSeedRisk(API_BASE, request);

  if (!response.ok && response.status === 503 && import.meta.env.DEV && API_BASE !== '/api') {
    response = await postSeedRisk('/api', request);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as Record<string, unknown>));
    const details = Array.isArray(errorData.errors)
      ? (errorData.errors as SeedRiskApiErrorDetail[])
      : undefined;
    const message =
      (typeof errorData.message === 'string' && errorData.message) ||
      (typeof errorData.error === 'string' && errorData.error) ||
      `Backend error: ${response.status} ${response.statusText}`;

    throw new SeedRiskApiError(message, response.status, details);
  }

  return (await response.json()) as SeedRiskApiResponse;
}