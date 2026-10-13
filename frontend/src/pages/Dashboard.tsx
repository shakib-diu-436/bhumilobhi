import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../services/api';
import type { DashboardSummary } from '../types/api';
import { useAuth } from '../auth/AuthProvider';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setSummary(null);
    try { setSummary(await api.getDashboardSummary()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load dashboard data'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const shortcuts = [
    { title: 'Find an owner', desc: 'Search synthetic owner IDs and linked plots.', to: '/owners', icon: '⌕', color: 'blue' },
    { title: 'Investigate a plot', desc: summary?.plots[0] ? `Open ${summary.plots[0].plot_code} from the database.` : 'No plots are available in the database.', to: summary?.plots[0] ? `/plots/${summary.plots[0].plot_id}` : null, icon: '▦', color: 'violet' },
    { title: 'Review conflicts', desc: 'Inspect saved conflict flags and evidence.', to: '/fraud-alerts', icon: '⚑', color: 'orange' },
  ];
  return <>
    <PageHeader eyebrow="LAND OWNERSHIP INTELLIGENCE · SYNTHETIC ENVIRONMENT" title={`Welcome, ${user?.display_name || 'there'}`} description="Here’s what’s happening across your synthetic land-record workspace." action={<Link className="button button-primary" to="/fraud-alerts"><span>＋</span> Investigate conflicts</Link>} />
    <div className="notice-banner"><div className="notice-symbol">i</div><div><strong>Demo data is active</strong><p>All owners, plots and ownership records in this prototype are synthetic. Conflict alerts indicate records for manual review, not a legal finding of fraud.</p></div><StatusBadge tone="blue">Synthetic data</StatusBadge></div>
    <div className="section-heading"><div><h2>Workspace overview</h2><p>Counts returned from the authenticated database API</p></div></div>
    <div className="stats-grid">
      <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-blue">▦</span><span className="stat-trend neutral">DATABASE</span></div><div className="stat-label">Plots</div><div className="stat-value">{loading ? '—' : summary?.plot_count ?? '—'}</div><div className="stat-foot">Records currently stored</div></article>
      <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-purple">♙</span><span className="stat-trend neutral">DATABASE</span></div><div className="stat-label">Owners</div><div className="stat-value">{loading ? '—' : summary?.owner_count ?? '—'}</div><div className="stat-foot">Synthetic owner records</div></article>
      <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-orange">⚑</span><span className="stat-trend warning">OPEN</span></div><div className="stat-label">Open alerts</div><div className="stat-value">{loading ? '—' : summary?.open_alert_count ?? '—'}</div><div className="stat-foot">Saved investigation leads</div></article>
      <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-green">◇</span><span className="stat-trend neutral">DATABASE</span></div><div className="stat-label">Deeds</div><div className="stat-value">{loading ? '—' : summary?.deed_count ?? '—'}</div><div className="stat-foot">Stored deed metadata</div></article>
    </div>
    {error && <ErrorState message={error} onRetry={() => void load()} />}
    <div className="dashboard-grid">
      <section className="panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Jump into a workflow</p></div></div><div className="quick-list">{shortcuts.map(item => item.to ? <Link to={item.to} className="quick-item" key={item.title}><span className={`quick-icon quick-${item.color}`}>{item.icon}</span><span className="quick-copy"><strong>{item.title}</strong><small>{item.desc}</small></span><span className="quick-arrow">↗</span></Link> : <div className="quick-item quick-item-disabled" key={item.title}><span className={`quick-icon quick-${item.color}`}>{item.icon}</span><span className="quick-copy"><strong>{item.title}</strong><small>{item.desc}</small></span></div>)}</div></section>
      <section className="panel alerts-panel"><div className="panel-heading"><div><h2>Latest conflict alerts</h2><p>Recent saved records that may need review</p></div><Link to="/fraud-alerts" className="text-link">View all ↗</Link></div>
        {loading ? <LoadingState label="Loading dashboard from database…" /> : !error && summary?.recent_alerts.length === 0 ? <div className="empty-state"><span className="empty-icon">✓</span><strong>No saved alerts</strong><p>Analyses will appear here after the backend detects a record conflict.</p><Link to="/fraud-alerts" className="button button-secondary button-small">Open alert workspace</Link></div> : !error && summary && <div className="table-wrap"><table><thead><tr><th>Plot / rule</th><th>Severity</th><th>Status</th><th /></tr></thead><tbody>{summary.recent_alerts.map(alert => <tr key={alert.id}><td><Link className="table-primary" to={`/plots/${alert.plot_id}`}>{alert.plot_id}</Link><small className="table-secondary">{alert.rule_code}</small></td><td><StatusBadge tone={alert.severity === 'HIGH' ? 'red' : 'amber'}>{alert.severity}</StatusBadge></td><td><StatusBadge tone={alert.status === 'OPEN' ? 'amber' : 'green'}>{alert.status}</StatusBadge></td><td><Link className="icon-button" to={`/plots/${alert.plot_id}`} aria-label={`Investigate ${alert.plot_id}`}>↗</Link></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  </>;
}
