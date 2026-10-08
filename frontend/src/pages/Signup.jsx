import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const success = await signup(email, password);
    setLoading(false);
    if (!success) setError('Registration failed. This email may already be in use.');
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🎯</div>
          <h1>RetainPro</h1>
          <p>Join thousands of teams using AI to understand customers and drive retention at scale.</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon" style={{ background: 'rgba(88,166,255,0.15)', color: '#58a6ff' }}>⚡</div>
            <div>
              <div className="auth-feature-title">Fast Setup</div>
              <div className="auth-feature-desc">Be up and running in under 5 minutes with CSV import.</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>🔒</div>
            <div>
              <div className="auth-feature-title">Secure by Default</div>
              <div className="auth-feature-desc">JWT auth, bcrypt hashing, and role-based access.</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon" style={{ background: 'rgba(63,185,80,0.15)', color: '#3fb950' }}>📈</div>
            <div>
              <div className="auth-feature-title">Real-time Analytics</div>
              <div className="auth-feature-desc">Live dashboard with KPIs, segments and trends.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h2>Create an account</h2>
          <p className="auth-subtitle">Start your RetainPro journey for free</p>

          {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="signup-password"
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                id="signup-confirm"
                type="password"
                className="form-input"
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
            <button
              id="signup-submit"
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="auth-link-row">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
