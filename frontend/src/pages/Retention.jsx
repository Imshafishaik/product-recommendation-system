import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiGet, apiPost } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Zap, RefreshCw } from 'lucide-react';

export default function Retention() {
  const { token } = useContext(AuthContext);
  const { addToast } = useToast();
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);

  const fetchAtRisk = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/analytics/rfm_segments', token);
      setAtRisk(data.filter(c => c.segment === 'At-Risk'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAtRisk(); }, []);

  const handleComputeRFM = async () => {
    setComputing(true);
    try {
      const res = await apiPost('/analytics/compute_rfm', {}, token);
      addToast(res.message, 'success');
      fetchAtRisk();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setComputing(false);
    }
  };

  const retentionStrategies = [
    {
      icon: '📧',
      title: 'Win-Back Email Campaign',
      desc: 'Send a personalized re-engagement email with a discount code to customers who haven\'t purchased in 60+ days.',
      color: '#58a6ff',
      segment: 'At-Risk',
    },
    {
      icon: '🎁',
      title: 'Loyalty Reward Unlock',
      desc: 'Notify loyal customers of special rewards or early access to new products to deepen brand attachment.',
      color: '#a78bfa',
      segment: 'Loyal',
    },
    {
      icon: '🏷️',
      title: 'First Purchase Incentive',
      desc: 'Send a time-limited offer to new customers to trigger their second purchase within 30 days.',
      color: '#39d0d8',
      segment: 'New',
    },
    {
      icon: '⭐',
      title: 'Champion Recognition',
      desc: 'Acknowledge top spenders with VIP status, early access, or exclusive perks to sustain advocacy.',
      color: '#3fb950',
      segment: 'Champions',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Retention Center</h1>
          <p>Churn prevention strategies and at-risk customer tracking</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={fetchAtRisk} id="refresh-retention">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="primary-btn" onClick={handleComputeRFM} disabled={computing} id="retention-rfm-btn">
            <Zap size={14} />
            {computing ? 'Computing…' : 'Re-run RFM Analysis'}
          </button>
        </div>
      </div>

      {/* Strategies */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
        {retentionStrategies.map((s) => (
          <div
            key={s.title}
            className="card"
            style={{ borderLeft: `3px solid ${s.color}`, marginBottom: 0 }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Target: <span style={{ color: s.color }}>{s.segment}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* At-risk table */}
      <div className="card-header" style={{ marginBottom: 12 }}>
        <div>
          <div className="card-title" style={{ color: 'var(--accent-red)' }}>
            ⚠ At-Risk Customers ({atRisk.length})
          </div>
          <div className="card-subtitle">These customers were previously active but haven't purchased recently. Prioritize them for win-back campaigns.</div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading at-risk customers…</div>
        ) : atRisk.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">✅</div>
            <p>No at-risk customers detected.</p>
            <small>Run RFM Analysis after importing transaction data to identify at-risk customers.</small>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Ref</th>
                <th>Name</th>
                <th>Email</th>
                <th>Segment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {atRisk.map(c => (
                <tr key={c.id}>
                  <td><code style={{ color: 'var(--accent-cyan)', fontSize: 12 }}>{c.customer_ref}</code></td>
                  <td><strong>{c.name || '—'}</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                  <td><span className="segment-badge at-risk">At-Risk</span></td>
                  <td>
                    <button
                      className="secondary-btn"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                      onClick={() => addToast(`Win-back email queued for ${c.name || c.email}`, 'success')}
                    >
                      📧 Send Win-Back
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
