import { ExternalLink } from 'lucide-react'

export default function HelpCenterModal({ onClose }) {
  return (
    <div className="shopper-backdrop">
      <section className="shopper-modal" style={{ width: 'min(680px, 100%)' }}>
        <header className="shopper-header">
          <div>
            <span className="eyebrow">SYSTEM ARCHITECTURE & DOCUMENTATION</span>
            <h2>MindsIT <span>Intelligence Guide</span></h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </header>
        <div className="shopper-body" style={{ display: 'grid', gap: 16 }}>
          <div className="import-section-desc">
            <p><strong>Connected Database:</strong> PostgreSQL <code>loyum_db</code> on <code>localhost:5432</code> with tables for users, customers, products, transactions, cart events, and jobs.</p>
          </div>
          <div className="detail-stat-card">
            <span className="eyebrow">RFM CUSTOMER SEGMENTATION</span>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#667', lineHeight: 1.5 }}>
              Groups customers by <strong>Recency</strong> (days since last purchase), <strong>Frequency</strong> (order count), and <strong>Monetary value</strong> (lifetime spend) into <code>Loyal</code>, <code>At risk</code>, <code>Growing</code>, <code>New</code>, and <code>Inactive</code>.
            </p>
          </div>
          <div className="detail-stat-card">
            <span className="eyebrow">COLLABORATIVE FILTERING</span>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#667', lineHeight: 1.5 }}>
              Scikit-learn cosine similarity computes item-to-item affinity matrices across customer baskets and live checkout cart events.
            </p>
          </div>
          <div className="detail-stat-card">
            <span className="eyebrow">INTERACTIVE API DOCUMENTATION</span>
            <p style={{ margin: '6px 0 8px', fontSize: 11, color: '#667' }}>
              Explore and test all active FastAPI endpoints with Swagger UI:
            </p>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--blue)', fontSize: 11, fontWeight: 700 }}
            >
              Open API Docs (http://localhost:8000/docs) <ExternalLink size={14} />
            </a>
          </div>
        </div>
        <footer className="shopper-footer">
          <span>Engine version 0.1.0 · Powered by FastAPI & PostgreSQL</span>
          <button onClick={onClose}>Close guide</button>
        </footer>
      </section>
    </div>
  )
}
