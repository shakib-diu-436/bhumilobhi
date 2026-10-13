import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountMenuError, setAccountMenuError] = useState('');
  const initials = user?.display_name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'U';
  useEffect(() => { setAccountMenuOpen(false); setAccountMenuError(''); }, [location.pathname]);
  async function signOut() {
    setAccountMenuError('');
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setAccountMenuError('Could not end the secure session. Check your connection and try again.');
    }
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand-mark">ভূ</span><span><strong>BhumiLobhi</strong><small>LAND INTELLIGENCE</small></span></NavLink>
      <div className="workspace-switch"><span className="workspace-avatar">BL</span><span><strong>Land workspace</strong><small>Conflict intelligence</small></span><span className="switch-chevron">⌄</span></div>
      {navGroups.map(group => <div className="nav-group" key={group.title}><div className="nav-label">{group.title}</div>{group.links.map(link => <NavLink key={link.to} to={link.to} end={'end' in link ? link.end : false} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><span className="nav-icon">{link.icon}</span><span>{link.label}</span>{link.to === '/fraud-alerts' && <span className="nav-count">!</span>}</NavLink>)}</div>)}
      <div className="sidebar-bottom"><div className="privacy-card"><span className="privacy-icon">✳</span><strong>Privacy-first demo</strong><p>Uses synthetic records only. No real NID or official land data.</p></div><div className="profile-row"><div className="profile-avatar">{initials}</div><div><strong>{user?.display_name}</strong><small>{user?.email}</small></div></div></div>
    </aside>
    <main className={`main-shell ${accountMenuOpen ? 'account-menu-open' : ''}`}><header className="topbar"><div className="mobile-brand"><span className="brand-mark">ভূ</span><strong>BhumiLobhi</strong></div><div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>{currentTitle(location.pathname)}</strong></div><div className="topbar-right"><span className="environment-pill"><span /> SYNTHETIC ENVIRONMENT</span><div className="account-menu"><button className="topbar-avatar" type="button" aria-label="Open account menu" aria-expanded={accountMenuOpen} onClick={() => { setAccountMenuError(''); setAccountMenuOpen(open => !open); }}>{initials}</button>{accountMenuOpen && <div className="account-menu-popover"><strong>{user?.display_name}</strong><span>{user?.email}</span>{accountMenuError && <p className="account-menu-error" role="alert">{accountMenuError}</p>}<button type="button" onClick={() => void signOut()}>Sign out <span>↗</span></button></div>}</div></div></header><div className="content-area"><Outlet /></div><footer className="app-footer"><span>© 2026 BhumiLobhi · Land ownership conflict intelligence</span><span><i /> Prototype · Not an official land-record system</span></footer></main>
  </div>;
}
