import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiGet, apiPost } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Zap, RefreshCw } from 'lucide-react';

const SEGMENT_COLORS = {
  Champions: '#58a6ff',
  Loyal: '#a78bfa',
  Active: '#3fb950',
  'At-Risk': '#f85149',
  New: '#39d0d8',
};

const SEGMENT_DESCRIPTIONS = {
  Champions:  'Bought recently, buy often, spend the most.',
  Loyal:      'Buy regularly and respond well to promotions.',
  Active:     'Buying at a moderate, healthy pace.',
  'At-Risk':  'Was valuable, but hasn\'t purchased recently.',
  New:        'Just joined — need nurturing to become loyal.',
};

function SegmentCard({ segment, count, total, description, color }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  return (
    <div className="rfm-segment-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="rfm-segment-title" style={{ color }}>{segment}</div>
      <div className="rfm-segment-count" style={{ color }}>{count}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{pct}% of customers</div>
      <div className="rfm-segment-desc">{description}</div>
    </div>
  );
}

export default function RFMSegmentation() {
  const { token } = useContext(AuthContext);
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [filterSeg, setFilterSeg] = useState('All');

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/analytics/rfm_segments', token);
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSegments(); }, []);

  const handleComputeRFM = async () => {
    setComputing(true);
    try {
      const res = await apiPost('/analytics/compute_rfm', {}, token);
      addToast(res.message, 'success');
      fetchSegments();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setComputing(false);
    }
  };

  const segmentCounts = {};
  customers.forEach(c => {
    segmentCounts[c.segment] = (segmentCounts[c.segment] || 0) + 1;
  });
  const total = customers.length;

  const filtered = filterSeg === 'All' ? customers : customers.filter(c => c.segment === filterSeg);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>RFM & Segmentation</h1>
          <p>Recency · Frequency · Monetary customer analysis</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={fetchSegments} id="refresh-rfm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="primary-btn" onClick={handleComputeRFM} disabled={computing} id="compute-rfm-btn">
            <Zap size={14} />
            {computing ? 'Computing…' : 'Run RFM Engine'}
          </button>
        </div>
      </div>

      {/* Segment summary cards */}
      <div className="rfm-grid">
        {Object.entries(SEGMENT_COLORS).map(([seg, color]) => (
          <SegmentCard
            key={seg}
            segment={seg}
            count={segmentCounts[seg] || 0}
            total={total}
            description={SEGMENT_DESCRIPTIONS[seg]}
            color={color}
          />
        ))}
      </div>

      {/* Explainer */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">How RFM Works</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'R — Recency', desc: 'How many days since the customer last purchased? Lower is better.', color: '#58a6ff' },
            { label: 'F — Frequency', desc: 'How many total units has the customer purchased? Higher is better.', color: '#a78bfa' },
            { label: 'M — Monetary', desc: 'How much has the customer spent in total? Higher value = more valuable.', color: '#3fb950' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 14, borderLeft: `3px solid ${item.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer segment table */}
      <div className="card-header" style={{ marginBottom: 12 }}>
        <div className="card-title">Customer Segments</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['All', ...Object.keys(SEGMENT_COLORS)].map(seg => (
            <button
              key={seg}
              id={`filter-seg-${seg}`}
              className={filterSeg === seg ? 'primary-btn' : 'secondary-btn'}
              style={{ padding: '5px 12px', fontSize: 12 }}
              onClick={() => setFilterSeg(seg)}
            >
              {seg} {seg !== 'All' && `(${segmentCounts[seg] || 0})`}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading segments…</div>
        ) : filtered.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📊</div>
            <p>No customers in this segment yet.</p>
            <small>Run the RFM Engine after importing transactions.</small>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Name</th>
                <th>Email</th>
                <th>Segment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const color = SEGMENT_COLORS[c.segment] || '#8b949e';
                const segClass = c.segment?.toLowerCase().replace(' ', '-') || 'new';
                return (
                  <tr key={c.id}>
                    <td><code style={{ color: 'var(--accent-cyan)', fontSize: 12 }}>{c.customer_ref}</code></td>
                    <td><strong>{c.name || '—'}</strong></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                    <td>
                      <span className={`segment-badge ${segClass}`}>{c.segment || 'New'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
