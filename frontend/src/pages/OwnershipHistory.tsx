import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import type { HistoryEvent } from '../types/api';

function extractEvents(data: HistoryEvent[] | Record<string, unknown>): HistoryEvent[] {
  if (Array.isArray(data)) return data;
  for (const key of ['events', 'history', 'timeline', 'records']) if (Array.isArray(data[key])) return data[key] as HistoryEvent[];
  return [];
}
export default function OwnershipHistory() {
  const { plotId = 'PLOT-001' } = useParams();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setEvents(extractEvents(await api.getOwnershipHistory(plotId))); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load history'); } finally { setLoading(false); } }, [plotId]);
  useEffect(() => { void load(); }, [load]);
  return <><PageHeader eyebrow="LAND RECORDS / RECORD TIMELINE" title="Ownership history" description={`Chronological ownership and deed events returned for ${plotId}.`} action={<Link className="button button-secondary" to={`/plots/${plotId}`}>← Back to plot</Link>} />
    <div className="history-summary"><div className="history-summary-icon">↗</div><div><span>Selected plot</span><strong>{plotId}</strong></div><div className="history-summary-divider"/><div><span>Timeline events</span><strong>{loading ? '—' : events.length}</strong></div><div className="history-summary-right"><StatusBadge tone="blue">Record history</StatusBadge></div></div>
    <section className="panel history-panel"><div className="panel-heading"><div><h2>Record timeline</h2><p>Events are shown as returned by the backend; the timeline is not a legal title opinion.</p></div></div>{loading ? <LoadingState label="Loading ownership history…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : events.length === 0 ? <div className="empty-state"><span className="empty-icon">↗</span><strong>No timeline events returned</strong><p>The API returned no history events for this plot, or the response format needs to be aligned.</p><Link to={`/plots/${plotId}`} className="button button-secondary button-small">View plot details</Link></div> : <div className="timeline">{events.map((event, index) => { const date = String(event.date || event.deed_date || event.valid_from || 'Date not provided'); const title = String(event.event_type || event.type || 'Record event').replaceAll('_', ' '); const description = String(event.description || event.owner_name || event.owner_id || 'Backend history record'); return <div className="timeline-event" key={`${date}-${index}`}><div className="timeline-rail"><span className="timeline-dot"/></div><div className="timeline-date">{date}</div><div className="timeline-body"><div className="timeline-title-row"><strong>{title}</strong><StatusBadge tone="blue">Recorded event</StatusBadge></div><p>{description}</p><small>{event.owner_id ? `Owner reference: ${String(event.owner_id)}` : 'Synthetic demo history'}</small></div></div>; })}</div>}</section>
  </>;
}
