import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { api } from '../services/api';
import type { FraudAlert } from '../types/api';

const shortcuts = [
  { title: 'Find an owner', desc: 'Search synthetic owner IDs and view linked plots.', to: '/owners', icon: '⌕', color: 'blue' },
  { title: 'Investigate a plot', desc: 'Inspect recorded shares and ownership details.', to: '/plots/PLOT-003', icon: '▦', color: 'violet' },
  { title: 'Review conflicts', desc: 'See flagged record conflicts and supporting evidence.', to: '/fraud-alerts', icon: '⚑', color: 'orange' },
];

export default function Dashboard() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { setAlerts(await api.getFraudAlerts()); } catch (e) { setError(e instanceof Error ? e.message : 'Unknown API error'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const openCount = alerts.filter(a => (a.status || 'OPEN').toUpperCase() === 'OPEN').length;
  return <>
    <PageHeader eyebrow="MONDAY, OCTOBER 13 · DEMO ENVIRONMENT" title="Good evening, Admin" description="Here’s what’s happening across your synthetic land-record workspace." action={<Link className="button button-primary" to="/fraud-alerts"><span>＋</span> Investigate conflicts</Link>} />
    <div className="notice-banner"><div className="notice-symbol">i</div><div><strong>Demo data is active</strong><p>All owners, plots and ownership records in this prototype are synthetic. Conflict alerts indicate records for manual review, not a legal finding of fraud.</p></div><StatusBadge tone="blue">Synthetic data</StatusBadge></div>
    <div className="section-heading"><div><h2>Workspace overview</h2><p>Quick snapshot of the prototype records</p></div><span className="muted-caption">Live alert count from API when connected</span></div>
    <div className="stats-grid">
      <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-blue">▦</span><span className="stat-trend neutral">DEMO</span></div><div className="stat-label">Sample plots</div><div className="stat-value">3</div><div className="stat-foot">Including one conflict scenario</div></article>
      <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-purple">♙</span><span className="stat-trend neutral">DEMO</span></div><div className="stat-label">Synthetic owners</div><div className="stat-value">3</div><div className="stat-foot">Synthetic identifiers only</div></article>
      <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-orange">⚑</span><span className="stat-trend warning">Review</span></div><div className="stat-label">Open alerts</div><div className="stat-value">{loading ? '—' : error ? '—' : openCount}</div><div className="stat-foot">{error ? 'API unavailable' : 'Loaded from fraud alerts API'}</div></article>
      <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-green">✓</span><span className="stat-trend positive">READY</span></div><div className="stat-label">Conflict engine</div><div className="stat-value">Active</div><div className="stat-foot">Rule-based share validation</div></article>
    </div>
    <div className="dashboard-grid">
      <section className="panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Jump into a workflow</p></div><span className="heading-dots">•••</span></div><div className="quick-list">{shortcuts.map((item, i) => <Link to={item.to} className="quick-item" key={item.title}><span className={`quick-icon quick-${item.color}`}>{item.icon}</span><span className="quick-copy"><strong>{item.title}</strong><small>{item.desc}</small></span><span className="quick-arrow">↗</span></Link>)}</div></section>
      <section className="panel alerts-panel"><div className="panel-heading"><div><h2>Latest conflict alerts</h2><p>Record-based flags that may need review</p></div><Link to="/fraud-alerts" className="text-link">View all ↗</Link></div>
        {loading ? <LoadingState label="Loading alerts from API…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : alerts.length === 0 ? <div className="empty-state"><span className="empty-icon">✓</span><strong>No saved alerts</strong><p>Run an analysis for PLOT-003 to create a synthetic conflict alert.</p><Link to="/plots/PLOT-003" className="button button-secondary button-small">Open conflict plot</Link></div> : <div className="table-wrap"><table><thead><tr><th>Plot / rule</th><th>Severity</th><th>Status</th><th /></tr></thead><tbody>{alerts.slice(0, 5).map((a) => <tr key={a.id || a.alert_id}><td><Link className="table-primary" to={`/plots/${a.plot_id}`}>{a.plot_id}</Link><small className="table-secondary">{a.rule_code}</small></td><td><StatusBadge tone={a.severity === 'HIGH' ? 'red' : 'amber'}>{a.severity}</StatusBadge></td><td><StatusBadge tone={a.status === 'OPEN' ? 'amber' : 'green'}>{a.status}</StatusBadge></td><td><Link className="icon-button" to="/fraud-alerts">↗</Link></td></tr>)}</tbody></table></div>}
      </section>
    </div>
    <section className="panel demo-scenario"><div className="scenario-icon">✳</div><div className="scenario-copy"><div className="eyebrow">FEATURED TEST SCENARIO</div><h2>Ownership share exceeds 100%</h2><p>PLOT-003 contains synthetic recorded shares of 75% and 50%, totalling 125%. Run the analysis to generate an explainable review alert.</p></div><div className="scenario-metric"><span>Total recorded share</span><strong>125%</strong><StatusBadge tone="red">Conflict scenario</StatusBadge></div><Link to="/plots/PLOT-003" className="button button-primary">Review plot <span>→</span></Link></section>
  </>;
}
