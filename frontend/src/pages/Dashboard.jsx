import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiGet, apiPost } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Users, Package, ShoppingCart, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';

const SEGMENT_COLORS = {
  Champions:  { color: '#58a6ff', bg: 'rgba(88,166,255,0.3)' },
  Loyal:      { color: '#a78bfa', bg: 'rgba(167,139,250,0.3)' },
  Active:     { color: '#3fb950', bg: 'rgba(63,185,80,0.3)' },
  'At-Risk':  { color: '#f85149', bg: 'rgba(248,81,73,0.3)' },
  New:        { color: '#39d0d8', bg: 'rgba(57,208,216,0.3)' },
};

export default function Dashboard() {
  const { token } = useContext(AuthContext);
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await apiGet('/analytics/dashboard', token);
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleComputeRFM = async () => {
    setComputing(true);
    try {
      const res = await apiPost('/analytics/compute_rfm', {}, token);
      addToast(res.message, 'success');
      fetchStats();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setComputing(false);
    }
  };

  const segDist = stats?.segment_distribution || {};
  const totalCustomers = stats?.total_customers || 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Overview Dashboard</h1>
          <p>Real-time metrics and system health</p>
        </div>
        <div className="header-actions">
          <div className="status-badge">System Online</div>
          <button
            className="secondary-btn"
            onClick={handleComputeRFM}
            disabled={computing}
            id="run-rfm-btn"
          >
            <RefreshCw size={14} />
            {computing ? 'Computing…' : 'Run RFM Analysis'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading dashboard…
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon blue"><Users size={18} /></div>
              <h3>Total Customers</h3>
              <p className="kpi-value">{(stats?.total_customers || 0).toLocaleString()}</p>
              <span className="kpi-trend">All registered customers</span>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon purple"><Package size={18} /></div>
              <h3>Active Products</h3>
              <p className="kpi-value">{(stats?.in_stock_products || 0).toLocaleString()}</p>
              <span className="kpi-trend">of {stats?.total_products || 0} total</span>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon green"><ShoppingCart size={18} /></div>
              <h3>Transactions</h3>
              <p className="kpi-value">{(stats?.total_transactions || 0).toLocaleString()}</p>
              <span className="kpi-trend">Total recorded</span>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon red"><AlertTriangle size={18} /></div>
              <h3>At-Risk Customers</h3>
              <p className="kpi-value warning">{stats?.at_risk_customers || 0}</p>
              <span className="kpi-trend negative">Need retention action</span>
            </div>
          </div>

          {/* Charts row */}
          <div className="dashboard-charts">
            {/* Segment Distribution */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">RFM Segment Distribution</div>
                  <div className="card-subtitle">Customer breakdown by behavior</div>
                </div>
              </div>
              {totalCustomers === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">📊</div>
                  <p>No segment data yet</p>
                  <small>Import customers &amp; run RFM Analysis</small>
                </div>
              ) : (
                <div className="segment-donut-grid">
                  {Object.entries(SEGMENT_COLORS).map(([seg, { color, bg }]) => {
                    const count = segDist[seg] || 0;
                    const pct = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;
                    return (
                      <div className="segment-row" key={seg}>
                        <div className="segment-bar-label" style={{ color }}>{seg}</div>
                        <div className="segment-bar-track">
                          <div
                            className="segment-bar-fill"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                        <div className="segment-bar-count">{count}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">System Summary</div>
                  <div className="card-subtitle">Data pipeline health</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Total Customers', value: stats?.total_customers || 0, color: '#58a6ff' },
                  { label: 'Total Products', value: stats?.total_products || 0, color: '#a78bfa' },
                  { label: 'Total Transactions', value: stats?.total_transactions || 0, color: '#3fb950' },
                  { label: 'In-Stock Products', value: stats?.in_stock_products || 0, color: '#39d0d8' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{item.label}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  💡 <strong style={{ color: 'var(--text-primary)' }}>Getting started:</strong>
                </div>
                <ol style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 16, lineHeight: 1.8 }}>
                  <li>Import customers via <strong style={{ color: 'var(--accent-blue)' }}>Customers → Import CSV</strong></li>
                  <li>Import products via <strong style={{ color: 'var(--accent-purple)' }}>Products → Import CSV</strong></li>
                  <li>Import transactions via <strong style={{ color: 'var(--accent-green)' }}>Transactions → Import CSV</strong></li>
                  <li>Click <strong style={{ color: 'var(--accent-orange)' }}>Run RFM Analysis</strong> to segment customers</li>
                  <li>Visit <strong style={{ color: 'var(--accent-cyan)' }}>Recommendations</strong> to generate ML suggestions</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
