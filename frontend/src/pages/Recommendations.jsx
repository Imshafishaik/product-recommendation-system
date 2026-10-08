import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiGet } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Zap, RefreshCw } from 'lucide-react';

export default function Recommendations() {
  const { token } = useContext(AuthContext);
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    apiGet('/customers/', token).then(data => {
      setCustomers(data);
      if (data.length > 0) setSelectedId(String(data[0].id));
    }).catch(console.error).finally(() => setLoadingCustomers(false));
  }, []);

  const generateRecommendations = async () => {
    if (!selectedId) return;
    setLoading(true);
    setGenerated(false);
    try {
      const data = await apiGet(`/recommendations/${selectedId}`, token);
      setRecs(data);
      setGenerated(true);
      if (data.length === 0) {
        addToast('No recommendations found — try importing more transaction data.', 'info');
      }
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => String(c.id) === selectedId);

  const rankColors = ['#58a6ff', '#a78bfa', '#3fb950', '#f0883e', '#39d0d8'];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Personalized Recommendations</h1>
          <p>Content-based ML engine using TF-IDF + cosine similarity</p>
        </div>
      </div>

      {/* Control panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Select Customer</div>
            <div className="card-subtitle">Choose a customer to generate their personalized product recommendations</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 240 }}>
            <label className="form-label">Customer</label>
            <select
              id="rec-customer-select"
              className="form-select"
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setGenerated(false); setRecs([]); }}
              disabled={loadingCustomers}
            >
              {loadingCustomers && <option>Loading customers…</option>}
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email || c.customer_ref} ({c.segment || 'Unknown'})
                </option>
              ))}
              {!loadingCustomers && customers.length === 0 && (
                <option>No customers imported yet</option>
              )}
            </select>
          </div>
          <button
            id="generate-recs-btn"
            className="primary-btn"
            style={{ padding: '9px 20px' }}
            onClick={generateRecommendations}
            disabled={loading || !selectedId || customers.length === 0}
          >
            <Zap size={14} />
            {loading ? 'Generating…' : 'Generate Recommendations'}
          </button>
        </div>

        {selectedCustomer && (
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div className="info-item">
              <label>Customer Ref</label>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{selectedCustomer.customer_ref}</span>
            </div>
            <div className="info-item">
              <label>Name</label>
              <span>{selectedCustomer.name || '—'}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{selectedCustomer.email || '—'}</span>
            </div>
            <div className="info-item">
              <label>RFM Segment</label>
              <span>
                <span className={`segment-badge ${(selectedCustomer.segment || 'new').toLowerCase().replace(' ', '-')}`}>
                  {selectedCustomer.segment || 'New'}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      {!generated && !loading && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>How the ML Engine Works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { step: '1', icon: '📥', title: 'Load Purchases', desc: "Fetches the customer's transaction history." },
              { step: '2', icon: '🧮', title: 'TF-IDF Vectorize', desc: 'Converts product features (tags, category, brand) into numerical vectors.' },
              { step: '3', icon: '📐', title: 'Cosine Similarity', desc: 'Calculates how similar each unowned product is to their purchase profile.' },
              { step: '4', icon: '🎯', title: 'Rank & Filter', desc: 'Returns top-K products sorted by similarity score, excluding already-purchased items.' },
            ].map(item => (
              <div key={item.step} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 4 }}>Step {item.step}: {item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          Running ML engine…
        </div>
      )}

      {generated && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title">
              Top {recs.length} Recommendations for {selectedCustomer?.name || selectedCustomer?.customer_ref}
            </div>
            <button className="secondary-btn" onClick={generateRecommendations} style={{ fontSize: 12 }}>
              <RefreshCw size={12} /> Regenerate
            </button>
          </div>

          {recs.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">🤖</div>
              <p>No recommendations generated.</p>
              <small>This customer may not have any transactions yet, or all products have been purchased.</small>
            </div>
          ) : (
            <div className="rec-grid">
              {recs.map((rec, idx) => (
                <div key={rec.product_id} className="rec-card">
                  <div className={`rec-rank ${idx < 3 ? 'top' : ''}`} style={idx < 3 ? { color: rankColors[idx], borderColor: rankColors[idx] + '50', background: rankColors[idx] + '18' } : {}}>
                    #{idx + 1}
                  </div>
                  <div className="rec-content">
                    <h4>{rec.title}</h4>
                    <p className="rec-reason">
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-purple)' }}>WHY?</span>{' '}
                      {rec.reason}
                    </p>
                    <div className="rec-score-bar">
                      <div className="rec-score-track">
                        <div className="rec-score-fill" style={{ width: `${rec.score * 100}%` }} />
                      </div>
                      <span className="rec-score-label">{(rec.score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rec.product_ref}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
