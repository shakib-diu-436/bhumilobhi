import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ErrorState from '../components/ErrorState';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import type { OwnerSearchResponse } from '../types/api';

export default function OwnerSearch() {
  const [identifier, setIdentifier] = useState('SYN-NID-0001');
  const [result, setResult] = useState<OwnerSearchResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function search(e: React.FormEvent) { e.preventDefault(); setLoading(true); setError(''); setResult(null); try { setResult(await api.searchOwner(identifier.trim())); } catch (err) { setError(err instanceof Error ? err.message : 'Search failed'); } finally { setLoading(false); } }
  return <><PageHeader eyebrow="LAND RECORDS / OWNER DIRECTORY" title="Owner search" description="Find synthetic owner profiles and inspect the plots connected to each record." />
    <section className="panel search-panel"><div className="panel-heading"><div><h2>Search by synthetic identifier</h2><p>Use a demo ID such as SYN-NID-0001. Never enter a real national ID.</p></div><StatusBadge tone="blue">Privacy-safe demo</StatusBadge></div>
      <form onSubmit={search} className="search-form"><label htmlFor="owner-id">Synthetic owner ID</label><div className="search-input-row"><span className="input-search-icon">⌕</span><input id="owner-id" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="SYN-NID-0001" required maxLength={40} /><button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search owner'} <span>→</span></button></div><div className="form-hint">Try: SYN-NID-0001, SYN-NID-0002 or SYN-NID-0003</div></form>
    </section>
    {error && <ErrorState message={error} />}
    {result && <><section className="panel owner-profile"><div className="owner-avatar-large">{result.display_name?.split(' ').map(s => s[0]).slice(0, 2).join('') || 'OW'}</div><div className="owner-main"><div className="eyebrow">OWNER PROFILE · {result.owner_code}</div><h2>{result.display_name}</h2><p>{result.synthetic_identifier}</p><div className="owner-tags"><StatusBadge tone="green">Synthetic record</StatusBadge><StatusBadge tone="blue">Active profile</StatusBadge></div></div><div className="owner-summary"><span>Linked plots</span><strong>{result.total_plots}</strong></div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Linked plots</h2><p>Active recorded ownership returned by the API</p></div><span className="result-count">{result.plots?.length || 0} records</span></div>{!result.plots?.length ? <div className="empty-state"><strong>No linked plots found</strong><p>This owner has no active recorded plot links in the demo database.</p></div> : <div className="table-wrap"><table><thead><tr><th>Plot</th><th>Mouza</th><th>Area</th><th>Recorded share</th><th>Details</th></tr></thead><tbody>{result.plots.map(p => <tr key={`${p.plot_id}-${p.plot_code}`}><td><Link className="table-primary" to={`/plots/${p.plot_id}`}>{p.plot_code}</Link><small className="table-secondary">{p.plot_id}</small></td><td>{p.mouza}</td><td>{p.area} {p.area_unit}</td><td><strong>{p.share_percentage}%</strong><small className="table-secondary">{p.share_numerator}/{p.share_denominator} share</small></td><td><Link className="text-link" to={`/plots/${p.plot_id}`}>View plot ↗</Link></td></tr>)}</tbody></table></div>}</section></>}
    {!result && !error && <div className="hint-grid"><div className="hint-card"><span>01</span><strong>Enter a demo ID</strong><p>Search uses synthetic identifiers stored in the local database.</p></div><div className="hint-card"><span>02</span><strong>Review linked plots</strong><p>See recorded shares and open a plot for more details.</p></div><div className="hint-card"><span>03</span><strong>Investigate conflicts</strong><p>Use the fraud workspace to run rule-based checks.</p></div></div>}
  </>;
}
