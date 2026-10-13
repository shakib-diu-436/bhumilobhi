import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navGroups = [
  { title: 'WORKSPACE', links: [
    { to: '/', label: 'Overview', icon: '◫', end: true },
    { to: '/owners', label: 'Owner search', icon: '⌕' },
    { to: '/fraud-alerts', label: 'Conflict alerts', icon: '⚑' },
  ]},
  { title: 'LAND RECORDS', links: [
    { to: '/plots/PLOT-001', label: 'Plot explorer', icon: '▦' },
    { to: '/history/PLOT-001', label: 'Ownership history', icon: '↗' },
    { to: '/deed-verification', label: 'Deed verification', icon: '◇' },
  ]},
];

function currentTitle(path: string) {
  if (path === '/') return 'Overview';
  if (path.startsWith('/owners')) return 'Owner search';
  if (path.startsWith('/fraud-alerts')) return 'Conflict alerts';
  if (path.startsWith('/plots')) return 'Plot explorer';
  if (path.startsWith('/history')) return 'Ownership history';
  if (path.startsWith('/deed-verification')) return 'Deed verification';
  return 'Workspace';
}

export default function AppLayout() {
  const location = useLocation();
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand-mark">ভূ</span><span><strong>BhumiLobhi</strong><small>LAND INTELLIGENCE</small></span></NavLink>
      <div className="workspace-switch"><span className="workspace-avatar">BL</span><span><strong>Demo workspace</strong><small>Hackathon prototype</small></span><span className="switch-chevron">⌄</span></div>
      {navGroups.map(group => <div className="nav-group" key={group.title}><div className="nav-label">{group.title}</div>{group.links.map(link => <NavLink key={link.to} to={link.to} end={'end' in link ? link.end : false} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{link.icon}</span><span>{link.label}</span>{link.to === '/fraud-alerts' && <span className="nav-count">!</span>}</NavLink>)}</div>)}
      <div className="sidebar-bottom"><div className="privacy-card"><span className="privacy-icon">✳</span><strong>Privacy-first demo</strong><p>Uses synthetic records only. No real NID or official land data.</p></div><div className="profile-row"><div className="profile-avatar">A</div><div><strong>Demo Admin</strong><small>Prototype reviewer</small></div><span className="profile-menu">•••</span></div></div>
    </aside>
    <main className="main-shell"><header className="topbar"><div className="mobile-brand"><span className="brand-mark">ভূ</span><strong>BhumiLobhi</strong></div><div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>{currentTitle(location.pathname)}</strong></div><div className="topbar-right"><span className="environment-pill"><span /> SYNTHETIC ENVIRONMENT</span><div className="topbar-avatar">A</div></div></header><div className="content-area"><Outlet /></div><footer className="app-footer"><span>© 2026 BhumiLobhi · Land ownership conflict intelligence</span><span><i /> Prototype · Not an official land-record system</span></footer></main>
  </div>;
}
