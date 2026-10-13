import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="auth-page">
    <section className="auth-brand-panel">
      <Link to="/login" className="auth-brand"><span className="auth-brand-mark">ভূ</span><span><strong>BhumiLobhi</strong><small>LAND INTELLIGENCE</small></span></Link>
      <div className="auth-brand-copy"><span className="auth-kicker">LAND OWNERSHIP CONFLICT INTELLIGENCE</span><h1>Clarity in every parcel.</h1><p>A secure workspace for exploring ownership records, tracing history, and reviewing potential conflicts.</p></div>
      <div className="auth-map" aria-hidden="true"><div className="auth-map-grid"><span className="auth-parcel auth-parcel-a"/><span className="auth-parcel auth-parcel-b"/><span className="auth-parcel auth-parcel-c"/><span className="auth-map-pin">⌖</span><span className="auth-map-label">SECTOR 04 · SYNTHETIC</span></div></div>
      <p className="auth-privacy-note"><span /> Synthetic records only · Not an official land-record system</p>
    </section>
    <section className="auth-form-side"><div className="auth-mobile-brand"><span className="auth-brand-mark">ভূ</span><strong>BhumiLobhi</strong></div>{children}<footer className="auth-form-footer">BhumiLobhi · Land ownership conflict intelligence</footer></section>
  </main>;
}