import { useState } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'

export default function CreateCampaignModal({ metrics, onClose, onCreate }) {
  const [name, setName] = useState('At-Risk Winback Boost')
  const [segment, setSegment] = useState('At risk')
  const [offerType, setOfferType] = useState('Discount')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    onCreate({ name, segment, offer_type: offerType })
  }

  return (
    <div className="shopper-backdrop">
      <section className="shopper-modal campaign-modal">
        <header className="shopper-header">
          <div>
            <span className="eyebrow">RETENTION AUTOMATION</span>
            <h2>Create <span>targeted campaign</span></h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="shopper-body">
            <div className="form-group">
              <label>Campaign Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VIP Spring Reward"
                required
              />
            </div>
            <div className="form-group">
              <label>Target Customer Segment</label>
              <select value={segment} onChange={(e) => setSegment(e.target.value)}>
                <option value="At risk">At risk (losing momentum)</option>
                <option value="Loyal">Loyal (highest frequency & spend)</option>
                <option value="Growing">Growing (regular recurring)</option>
                <option value="New">New (recent first-time buyers)</option>
                <option value="Inactive">Inactive (dormant &gt; 45 days)</option>
                <option value="All segments">All customer segments</option>
              </select>
            </div>
            <div className="form-group">
              <label>Incentive / Offer Type</label>
              <select value={offerType} onChange={(e) => setOfferType(e.target.value)}>
                <option value="Discount">15% Off Your Next Order</option>
                <option value="Double points">Double Loyalty Points (2x Reward)</option>
                <option value="VIP access">VIP Early Collection Access</option>
                <option value="Free gift">Complimentary Discovery Bundle Gift</option>
              </select>
            </div>
            <div className="campaign-audience-preview">
              <div>
                <strong>Audience preview</strong>
                <span>Targeted from PostgreSQL loyum_db</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: 'var(--navy)' }}>
                  {segment === 'At risk' ? metrics.atRiskCustomers : segment === 'All segments' ? metrics.activeCustomers : '~48'} recipients
                </strong>
                <span>Expected lift: +18%</span>
              </div>
            </div>
          </div>
          <footer className="shopper-footer">
            <span><Sparkles size={14} /> Campaign will be recorded in PostgreSQL loyum_db</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} style={{ opacity: 0.8 }}>Cancel</button>
              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
                style={{ background: 'var(--coral)', color: '#fff' }}
              >
                {submitting ? 'Launching...' : 'Launch campaign'} <ArrowUpRight size={14} />
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
