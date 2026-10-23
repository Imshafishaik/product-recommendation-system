import { useState } from 'react'
import { ArrowUpRight, Plus, Sparkles, Tag } from 'lucide-react'
import { API_BASE, authHeaders } from '../constants'

export default function AddProductModal({ onClose, onProductAdded }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Fashion')
  const [price, setPrice] = useState('75.00')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const getCategoryClass = (cat = '') => {
    const c = cat.toLowerCase()
    if (c.includes('lifestyle')) return 'art-lifestyle'
    if (c.includes('fashion') || c.includes('apparel')) return 'art-fashion'
    if (c.includes('access')) return 'art-accessories'
    if (c.includes('home') || c.includes('decor')) return 'art-home'
    if (c.includes('reward')) return 'art-rewards'
    return 'art-lifestyle'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Product name is required.')
      return
    }
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/api/v1/products`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          price: numPrice,
          reason: reason.trim() || `Popular item in the ${category.toLowerCase()} collection`,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to add product to storefront')
      }

      if (onProductAdded) {
        onProductAdded(data)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shopper-backdrop">
      <section className="shopper-modal campaign-modal" style={{ width: 'min(720px, 100%)' }}>
        <header className="shopper-header">
          <div>
            <span className="eyebrow">STOREFRONT INVENTORY MANAGEMENT</span>
            <h2>Add <span>item to storefront</span></h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="shopper-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && <div className="auth-error">{error}</div>}

              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cashmere Knit Cardigan"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Fashion">Fashion & Apparel</option>
                  <option value="Lifestyle">Lifestyle & Living</option>
                  <option value="Accessories">Accessories & Leather</option>
                  <option value="Home">Home & Fragrance</option>
                  <option value="Rewards">Rewards & Loyalty</option>
                </select>
              </div>

              <div className="form-group">
                <label>Price ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="75.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Recommendation Copy / Note</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`e.g. Frequently paired with your saved ${category.toLowerCase()} favorites`}
                />
              </div>
            </div>

            {/* Live Storefront Preview */}
            <div className="preview-column">
              <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
                LIVE STOREFRONT PREVIEW
              </span>
              <article className="shopper-product" style={{ width: '100%', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
                <div className={`product-art ${getCategoryClass(category)}`}>
                  <span className="product-art-glyph">{category ? category.slice(0, 1) : 'P'}</span>
                  <span className="product-art-tag">{category}</span>
                </div>
                <div className="product-details">
                  <span className="product-category">{category}</span>
                  <h4 title={name || 'Your Product Title'}>{name || 'Product Title'}</h4>
                  <p title={reason || `Curated ${category} addition to your storefront`}>
                    {reason || `Popular item in the ${category.toLowerCase()} collection`}
                  </p>
                  <div className="product-bottom-lock">
                    <div className="product-price-row">
                      <strong>${parseFloat(price || 0).toFixed(2)}</strong>
                      <span className="in-stock-label">In stock</span>
                    </div>
                    <button type="button" className="product-button added" style={{ cursor: 'default' }}>
                      <Tag size={13} /> In Storefront
                    </button>
                  </div>
                </div>
              </article>
              <p style={{ fontSize: '11px', color: '#728285', marginTop: '10px', lineHeight: 1.4 }}>
                This item will be saved in PostgreSQL <code>loyum_db</code>, listed in the <strong>Shopper preview</strong>, and fed into collaborative filtering.
              </p>
            </div>
          </div>

          <footer className="shopper-footer">
            <span>
              <Sparkles size={14} /> Item automatically updates the recommendation affinity matrix
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} style={{ opacity: 0.8 }}>Cancel</button>
              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
                style={{ background: '#48a782', color: '#fff' }}
              >
                {submitting ? 'Adding item...' : 'Add to storefront'} <ArrowUpRight size={14} />
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
