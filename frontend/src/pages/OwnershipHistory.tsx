import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import type { OwnershipHistoryResponse } from '../types/api';
export default function OwnershipHistory() {
  const { plotId = '' } = useParams();
  const [history, setHistory] = useState<OwnershipHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); setHistory(null); try { setHistory(await api.getOwnershipHistory(plotId)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load history'); } finally { setLoading(false); } }, [plotId]);
  useEffect(() => { void load(); }, [load]);
  return <><PageHeader eyebrow="LAND RECORDS / RECORD TIMELINE" title="Ownership history" description={`Chronological ownership and deed events returned for ${plotId}.`} action={<Link className="button button-secondary" to={`/plots/${plotId}`}>← Back to plot</Link>} />
    <div className="history-summary"><div className="history-summary-icon">↗</div><div><span>Selected plot</span><strong>{history?.plot_code || plotId}</strong></div><div className="history-summary-divider"/><div><span>Timeline events</span><strong>{loading ? '—' : history?.history_count ?? 0}</strong></div><div className="history-summary-right"><StatusBadge tone="blue">Record history</StatusBadge></div></div>
    <section className="panel history-panel"><div className="panel-heading"><div><h2>Record timeline</h2><p>{history?.note || 'Chronological database events; this is not a legal title opinion.'}</p></div></div>{loading ? <LoadingState label="Loading ownership history…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : !history?.history.length ? <div className="empty-state"><span className="empty-icon">↗</span><strong>No timeline events returned</strong><p>The backend returned no ownership or deed events for this plot.</p><Link to={`/plots/${plotId}`} className="button button-secondary button-small">View plot details</Link></div> : <div className="timeline">{history.history.map(event => { const title = event.event_type === 'DEED' ? `${event.deed_type || 'Deed'} deed` : 'Ownership record'; const description = event.event_type === 'DEED' ? `Verification state: ${event.verification_status || 'not provided'}` : `Owner: ${event.owner_name || event.owner_id || 'Unknown'} · Share: ${event.share || 'not provided'} · Record status: ${event.status || 'not provided'}`; return <div className="timeline-event" key={event.record_id}><div className="timeline-rail"><span className="timeline-dot"/></div><div className="timeline-date">{event.date}</div><div className="timeline-body"><div className="timeline-title-row"><strong>{title}</strong><StatusBadge tone={event.event_type === 'DEED' ? 'amber' : 'blue'}>{event.event_type === 'DEED' ? 'Deed event' : 'Ownership event'}</StatusBadge></div><p>{description}</p><small>Record ID: {event.record_id}{event.valid_to ? ` · Valid to ${event.valid_to}` : ''}</small></div></div>; })}</div>}</section>
  </>;
}
