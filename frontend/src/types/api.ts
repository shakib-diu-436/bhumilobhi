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
  alerts: Array<FraudAlert & { alert_id?: string }>;
  requires_manual_review: boolean;
  note: string;
  alerts_saved?: number;
};

export type PlotDetailsResponse = {
  id?: string;
  plot_id?: string;
  plot_code: string;
  mouza: string;
  jl_number?: string | null;
  area: number;
  area_unit: string;
  is_synthetic_boundary?: boolean;
  owners?: Array<Record<string, unknown>>;
  ownerships?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type HistoryEvent = {
  event_type?: string;
  type?: string;
  date?: string;
  deed_date?: string;
  valid_from?: string;
  description?: string;
  owner_name?: string;
  owner_id?: string;
  [key: string]: unknown;
};
