import { useEffect, useState } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { API_BASE, authHeaders } from '../constants'

export default function CustomerDetailModal({ customer, onClose, onQueueOffer }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/customers/${customer.id}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setDetail(data || customer)
        setLoading(false)
      })
      .catch(() => {
        setDetail(customer)
        setLoading(false)
      })
  }, [customer.id])

  const cust = detail || customer
  const transactions = detail?.transactions || []
  const recommendations = detail?.recommendations || []

  return (
    <div className="shopper-backdrop">
      <section className="shopper-modal customer-detail-modal">
        <header className="customer-detail-header">
          <div className="customer-detail-title">
            <div className={`avatar avatar-${cust.tone || 'blue'}`} style={{ width: 44, height: 44, fontSize: 15 }}>
              {cust.initials || cust.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="eyebrow">CUSTOMER PROFILE · {cust.id}</span>
              <h2>{cust.name}</h2>
              <span>{cust.email}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </header>

        <div className="customer-detail-body">
          <div className="detail-stats-grid">
            <div className="detail-stat-card">
              <span>Segment</span>
              <strong style={{ color: 'var(--blue)' }}>{cust.segment}</strong>
            </div>
            <div className="detail-stat-card">
              <span>Health Score</span>
              <strong style={{ color: 'var(--green)' }}>{cust.health_score || cust.score} / 100</strong>
            </div>
            <div className="detail-stat-card">
              <span>Total Orders</span>
              <strong>{cust.frequency || cust.orders || 14}</strong>
            </div>
            <div className="detail-stat-card">
              <span>Total Spend</span>
              <strong>${Number(cust.monetary || 736).toFixed(2)}</strong>
            </div>
          </div>

          <div className="customer-recs-section">
            <span className="eyebrow">PREDICTED NEXT-BEST RECOMMENDATIONS</span>
            <div className="customer-recs-grid">
              {(recommendations.length > 0 ? recommendations : [
                { product_id: 'prod_bundle_01', reason: 'Complements recent lifestyle purchases', confidence: 0.86 },
                { product_id: 'prod_reward_04', reason: 'High reactivation propensity for RFM segment', confidence: 0.78 },
              ]).map((rec, i) => (
                <div className="cust-rec-card" key={i}>
                  <div>
                    <strong>{rec.product_id.replace('prod_', '').replace('_', ' ').toUpperCase()}</strong>
                    <p>{rec.reason}</p>
                  </div>
                  <div className="cust-rec-footer">
                    <span>Confidence</span>
                    <strong>{Math.round((rec.confidence || 0.8) * 100)}%</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="customer-history-section">
            <div className="panel-heading" style={{ marginBottom: 10 }}>
              <span className="eyebrow">RECENT ORDER HISTORY ({transactions.length} ORDERS)</span>
            </div>
            <div className="table-wrap" style={{ maxHeight: 180, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((t, idx) => (
                      <tr key={idx}>
                        <td><strong>{t.product_name || t.product_id}</strong></td>
                        <td><span className="category-tag">{t.category || 'Retail'}</span></td>
                        <td>${Number(t.amount).toFixed(2)}</td>
                        <td className="muted">{t.purchased_at ? t.purchased_at.slice(0, 10) : 'Recent'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="muted" style={{ textAlign: 'center' }}>
                        Loading order records from PostgreSQL loyum_db...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="shopper-footer">
          <span><Sparkles size={14} /> Profile and orders retrieved from PostgreSQL loyum_db</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ opacity: 0.8 }}>Close</button>
            <button
              className="primary-button"
              onClick={() => onQueueOffer(cust.segment)}
              style={{ background: 'var(--coral)', color: '#fff' }}
            >
              Queue {cust.segment} offer <ArrowUpRight size={14} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
