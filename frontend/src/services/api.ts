import type { FraudAlert, FraudAnalysis, OwnerSearchResponse, PlotDetailsResponse, HistoryEvent } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
  } catch {
    throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Check that FastAPI is running and CORS is enabled.`);
  }
  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try { const parsed = JSON.parse(text); detail = parsed.detail || text; } catch { /* use response text */ }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return response.json() as Promise<T>;
}

export const api = {
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
