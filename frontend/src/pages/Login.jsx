import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (!success) setError('Invalid email or password. Please try again.');
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">🎯</div>
          <h1>RetainPro</h1>
          <p>AI-powered product recommendations and customer retention engine for modern e-commerce teams.</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon" style={{ background: 'rgba(88,166,255,0.15)', color: '#58a6ff' }}>📊</div>
            <div>
              <div className="auth-feature-title">RFM Segmentation</div>
              <div className="auth-feature-desc">Automatically classify customers by behavior patterns.</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>🤖</div>
            <div>
              <div className="auth-feature-title">ML Recommendations</div>
              <div className="auth-feature-desc">Content-based filtering to suggest the right products.</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon" style={{ background: 'rgba(63,185,80,0.15)', color: '#3fb950' }}>📥</div>
            <div>
              <div className="auth-feature-title">CSV Import</div>
              <div className="auth-feature-desc">Bulk-import customers, products and transactions instantly.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to your RetainPro workspace</p>

          {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="login-email"
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
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-link-row">
            Don't have an account?{' '}
            <Link to="/signup">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
