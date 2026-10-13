import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../auth/AuthProvider';

function destination(state: unknown) {
  const from = (state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
  return from?.pathname ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/';
}

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(destination(location.state), { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return <AuthLayout><div className="auth-form-card">
    <div className="auth-form-heading"><span className="auth-kicker">WELCOME BACK</span><h2>Sign in to your workspace</h2><p>Use your registered email to continue to land intelligence.</p></div>
    <form className="auth-form" onSubmit={submit} noValidate>
      <label htmlFor="login-email">Email address</label>
      <input id="login-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" maxLength={320} required />
      <div className="auth-label-row"><label htmlFor="login-password">Password</label></div>
      <div className="auth-password-field"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <><span className="spinner auth-button-spinner" />Signing in…</> : <>Sign in <span>→</span></>}</button>
    </form>
    <p className="auth-switch">New to BhumiLobhi? <Link to="/register" state={location.state}>Create an account</Link></p>
  </div></AuthLayout>;
}