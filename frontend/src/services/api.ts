import type { AuthResponse, FraudAlert, FraudAnalysis, OwnerSearchResponse, PlotDetailsResponse, HistoryEvent } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
let accessToken: string | null = null;
let refreshInFlight: Promise<AuthResponse> | null = null;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function fetchJson<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    if (options.body) headers.set('Content-Type', 'application/json');
    if (authenticated && accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    });
  } catch {
    throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Check that FastAPI is running and CORS is enabled.`);
  }
  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.detail || text;
      if (Array.isArray(detail)) {
        detail = detail.map((item: { msg?: string }) => item.msg || 'Invalid input').join('. ');
      }
    } catch { /* use response text */ }
    throw new ApiError(typeof detail === 'string' ? detail : JSON.stringify(detail), response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function refreshAccessToken(): Promise<AuthResponse> {
  if (!refreshInFlight) {
    refreshInFlight = fetchJson<AuthResponse>('/auth/refresh', { method: 'POST' }, false)
      .then(result => {
        setAccessToken(result.access_token);
        return result;
      })
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  try {
    return await fetchJson<T>(path, options, authenticated);
  } catch (error) {
    if (authenticated && accessToken && error instanceof ApiError && error.status === 401 && !path.startsWith('/auth/')) {
      try {
        await refreshAccessToken();
        return await fetchJson<T>(path, options, true);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new Event('bhumi:session-expired'));
      }
    }
    throw error;
  }
}

export const api = {
  register: (displayName: string, email: string, password: string) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ display_name: displayName, email, password }) }, false),
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false),
  me: () => request<AuthResponse['user']>('/auth/me'),
  refreshSession: () => refreshAccessToken(),
  logout: () => request<void>('/auth/logout', { method: 'POST' }, false),
  searchOwner: (syntheticIdentifier: string) => request<OwnerSearchResponse>('/owners/search', { method: 'POST', body: JSON.stringify({ synthetic_identifier: syntheticIdentifier }) }),
  getPlot: (plotId: string) => request<PlotDetailsResponse>(`/plots/${encodeURIComponent(plotId)}`),
  getOwnershipHistory: (plotId: string) => request<HistoryEvent[] | Record<string, unknown>>(`/plots/${encodeURIComponent(plotId)}/history`),
  analyzePlot: (plotId: string) => request<FraudAnalysis>(`/fraud/analyze/${encodeURIComponent(plotId)}`, { method: 'POST' }),
  getFraudAlerts: (plotId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (plotId) params.set('plot_id', plotId);
    if (status) params.set('status', status);
    const query = params.toString();
    return request<FraudAlert[]>(`/fraud/alerts${query ? `?${query}` : ''}`);
  },
};

export const apiBaseUrl = API_BASE_URL;
