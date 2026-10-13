import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../services/api';
import type { FraudAnalysis, PlotDetailsResponse } from '../types/api';

export default function PlotDetails() {
  const { plotId = 'PLOT-001' } = useParams();
  const [plot, setPlot] = useState<PlotDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<FraudAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setPlot(await api.getPlot(plotId)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load plot'); } finally { setLoading(false); } }, [plotId]);
  useEffect(() => { void load(); setAnalysis(null); }, [load]);
  async function runAnalysis() { setAnalyzing(true); setError(''); try { setAnalysis(await api.analyzePlot(plotId)); } catch (e) { setError(e instanceof Error ? e.message : 'Analysis failed'); } finally { setAnalyzing(false); } }
  const owners = (plot?.owners || plot?.ownerships || []) as Array<Record<string, unknown>>;
  return <><PageHeader eyebrow="LAND RECORDS / PLOT EXPLORER" title="Plot details" description="Inspect a plot's recorded attributes, current ownership shares and rule-based conflict checks." action={<button className="button button-primary" onClick={() => void runAnalysis()} disabled={analyzing}>{analyzing ? 'Analyzing…' : 'Run conflict analysis'} <span>↗</span></button>} />
    <div className="plot-id-bar"><div className="plot-id-icon">▦</div><div><strong>{plot?.plot_code || plotId}</strong><span>Internal demo record ID: {plotId}</span></div><StatusBadge tone="blue">Synthetic record</StatusBadge></div>
    {loading ? <LoadingState label="Loading plot from database API…" /> : error && !plot ? <ErrorState message={error} onRetry={() => void load()} /> : plot && <>
      <div className="plot-layout"><section className="panel plot-info-panel"><div className="panel-heading"><div><h2>Plot overview</h2><p>Attributes returned by the backend</p></div><StatusBadge tone={plot.is_synthetic_boundary === false ? 'gray' : 'blue'}>{plot.is_synthetic_boundary === false ? 'Boundary unverified' : 'Synthetic boundary'}</StatusBadge></div><div className="plot-map-placeholder"><div className="map-grid"><div className="parcel parcel-one"/><div className="parcel parcel-two"/><div className="parcel parcel-three"/><div className="map-pin">⌖</div></div><div className="map-caption"><span className="map-legend-dot"/> DEMO MAP · NOT AN OFFICIAL CADASTRAL BOUNDARY</div></div><div className="detail-grid"><div><span>Mouza</span><strong>{plot.mouza || '—'}</strong></div><div><span>JL number</span><strong>{plot.jl_number || '—'}</strong></div><div><span>Recorded area</span><strong>{plot.area} {plot.area_unit}</strong></div><div><span>Plot code</span><strong>{plot.plot_code}</strong></div></div></section>
        <section className="panel ownership-panel"><div className="panel-heading"><div><h2>Recorded ownership</h2><p>Current records supplied by the API</p></div><Link className="text-link" to={`/history/${plotId}`}>History ↗</Link></div>{owners.length === 0 ? <div className="empty-state"><strong>Ownership data unavailable</strong><p>The plot response did not include an owners or ownerships list.</p></div> : <div className="ownership-list">{owners.map((owner, index) => { const name = String(owner.display_name || owner.owner_name || owner.owner_id || owner.owner_code || `Owner ${index + 1}`); const share = Number(owner.share_percentage ?? (Number(owner.share_numerator) / Number(owner.share_denominator) * 100)); return <div className="ownership-row" key={String(owner.owner_id || index)}><div className="mini-avatar">{name.slice(0, 1)}</div><div className="ownership-person"><strong>{name}</strong><small>{String(owner.owner_id || owner.owner_code || 'Synthetic owner')}</small></div><div className="ownership-share"><strong>{Number.isFinite(share) ? `${share}%` : '—'}</strong><div className="share-track"><span style={{ width: `${Math.min(100, Math.max(0, Number.isFinite(share) ? share : 0))}%` }}/></div></div></div>; })}</div>}</section></div>
      {analysis && <section className={`panel analysis-result ${analysis.requires_manual_review ? 'analysis-warning' : 'analysis-clean'}`}><div className="panel-heading"><div><div className="eyebrow">ANALYSIS RESULT</div><h2>{analysis.analysis_status.replaceAll('_', ' ')}</h2><p>{analysis.note}</p></div><StatusBadge tone={analysis.requires_manual_review ? 'red' : 'green'}>{analysis.requires_manual_review ? 'Manual review required' : 'No conflict detected'}</StatusBadge></div><div className="analysis-metrics"><div><span>Total recorded share</span><strong>{analysis.total_recorded_share_percentage}%</strong></div><div><span>Alerts detected</span><strong>{analysis.alert_count}</strong></div><div><span>Alerts saved</span><strong>{analysis.alerts_saved ?? '—'}</strong></div></div>{analysis.alerts.map((alert, i) => <div className="evidence-card" key={alert.alert_id || alert.rule_code || i}><div><StatusBadge tone={alert.severity === 'HIGH' ? 'red' : 'amber'}>{alert.severity}</StatusBadge><strong>{alert.rule_code}</strong><p>{alert.message}</p></div><div className="evidence-items">{alert.evidence?.map((item, j) => <span key={j}>{String(item.ownership_record_id || JSON.stringify(item))}</span>)}</div></div>)}<Link to="/fraud-alerts" className="text-link">Open alert workspace ↗</Link></section>}
      {error && plot && <ErrorState message={error} />}
    </>}
  </>;
}
