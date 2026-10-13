import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../auth/AuthProvider';

export default function Register() {
  const { register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!displayName.trim()) return setError('Enter your full name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return setError('Use at least 12 characters with lowercase, uppercase, and a number.');
    }
    if (password !== confirmPassword) return setError('Your passwords do not match.');
    setLoading(true);
    try {
      await register({ displayName: displayName.trim(), email: email.trim(), password });
      const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
      navigate(from?.pathname ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return <AuthLayout><div className="auth-form-card auth-register-card">
    <div className="auth-form-heading"><span className="auth-kicker">CREATE YOUR ACCOUNT</span><h2>Join your land workspace</h2><p>Set up a secure account to review ownership intelligence.</p></div>
    <form className="auth-form" onSubmit={submit} noValidate>
      <label htmlFor="register-name">Full name</label>
      <input id="register-name" autoComplete="name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Your name" maxLength={120} required />
      <label htmlFor="register-email">Email address</label>
      <input id="register-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" maxLength={320} required />
      <label htmlFor="register-password">Password</label>
      <div className="auth-password-field"><input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Create a strong password" minLength={12} maxLength={128} required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>
      <p className="auth-field-hint">At least 12 characters, with uppercase, lowercase, and a number.</p>
      <label htmlFor="register-confirm">Confirm password</label>
      <input id="register-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Enter your password again" required />
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <><span className="spinner auth-button-spinner" />Creating account…</> : <>Create account <span>→</span></>}</button>
    </form>
    <p className="auth-switch">Already have an account? <Link to="/login" state={location.state}>Sign in</Link></p>
  </div></AuthLayout>;
}