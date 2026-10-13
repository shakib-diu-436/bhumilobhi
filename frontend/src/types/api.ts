export type OwnerPlotResult = {
  plot_id: string;
  plot_code: string;
  mouza: string;
  area: number;
  area_unit: string;
  share_numerator: number;
  share_denominator: number;
  share_percentage: number;
};

export type OwnerSearchResponse = {
  owner_id: string;
  owner_code: string;
  display_name: string;
  synthetic_identifier: string;
  total_plots: number;
  plots: OwnerPlotResult[];
};

export type FraudAlert = {
  id: string;
  alert_id?: string;
  plot_id: string;
  rule_code: string;
  severity: string;
  message: string;
  evidence: Array<Record<string, unknown>>;
  status: string;
  created_at?: string;
};

export type FraudAnalysis = {
  plot_id: string;
  analysis_status: string;
  total_recorded_share_percentage: number;
  alert_count: number;
  alerts: Array<{
    alert_id: string;
    rule_code: string;
    severity: string;
    message: string;
    evidence: Array<Record<string, unknown>>;
  }>;
  requires_manual_review: boolean;
  note: string;
  alerts_saved: number;
};

export type PlotOwner = {
  owner_id: string;
  owner_code: string;
  display_name: string;
  share_numerator: number;
  share_denominator: number;
  share_percentage: number;
};

export type PlotDetailsResponse = {
  plot_id: string;
  plot_code: string;
  mouza: string;
  jl_number?: string | null;
  area: number;
  area_unit: string;
  is_synthetic_boundary: boolean;
  owners: PlotOwner[];
  owner_count: number;
};

export type HistoryEvent = {
  date: string;
  event_type: 'OWNERSHIP_RECORD' | 'DEED' | string;
  record_id: string;
  owner_id?: string | null;
  owner_name?: string | null;
  share?: string | null;
  valid_to?: string | null;
  status?: string | null;
  deed_type?: string | null;
  verification_status?: string | null;
};

export type OwnershipHistoryResponse = {
  plot_id: string;
  plot_code: string;
  history_count: number;
  history: HistoryEvent[];
  note: string;
};

export type DashboardSummary = {
  plot_count: number;
  owner_count: number;
  deed_count: number;
  open_alert_count: number;
  recent_alerts: FraudAlert[];
  plots: Array<{ plot_id: string; plot_code: string }>;
};

export type DeedVerificationResult = {
  deed_id: string;
  status: 'MATCH' | 'MISMATCH' | 'NO_REFERENCE';
  reference_available: boolean;
  uploaded_sha256: string;
  message: string;
};

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  account_status: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: AuthUser;
};
