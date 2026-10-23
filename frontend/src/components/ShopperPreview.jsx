import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Plus,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import {
  API_BASE,
  authHeaders,
  currentIsoTime,
  initialCustomers,
  shopperProducts,
} from '../constants'
import AddProductModal from './AddProductModal'

export default function ShopperPreview({
  onClose,
  isModal = false,
  onOpenAddProduct,
  onProductAddedGlobal,
}) {
  const [cart, setCart] = useState([])
  const [catalog, setCatalog] = useState(shopperProducts)
  const [selectedCustomerId, setSelectedCustomerId] = useState('cus_001')
  const [customers, setCustomers] = useState(initialCustomers)
  const [simulatedCheckout, setSimulatedCheckout] = useState(false)
  const [showInternalAddModal, setShowInternalAddModal] = useState(false)
  const [newlyAddedId, setNewlyAddedId] = useState(null)

  const reloadCatalog = () => {
    const cartIds = cart.map((p) => p.id).join(',')
    const url = cartIds
      ? `${API_BASE}/api/v1/shopper/${selectedCustomerId}/recommendations?cart_product_ids=${cartIds}&limit=12`
      : `${API_BASE}/api/v1/catalog`

    fetch(url, { headers: authHeaders() })
      .then((response) => (response.ok ? response.json() : shopperProducts))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data)
        }
      })
      .catch(() => setCatalog(shopperProducts))
  }

  // Load real customer list from postgres database
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/customers`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCustomers(data.slice(0, 10))
        } else if (data && data.customers && data.customers.length > 0) {
          setCustomers(data.customers.slice(0, 10))
        }
      })
      .catch(() => {})
  }, [])

  // Fetch catalog or personalized recommendations for selected customer
  useEffect(() => {
    reloadCatalog()
  }, [selectedCustomerId, cart])

  // Load customer's active cart from database
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/shopper/${selectedCustomerId}/cart`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCart(data)
        }
      })
      .catch(() => {})
  }, [selectedCustomerId])

  const addToCart = async (product) => {
    setCart((items) => (items.some((item) => item.id === product.id) ? items : [...items, product]))
    try {
      await fetch(`${API_BASE}/api/v1/cart-events`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          product_id: product.id,
          event: 'add_to_cart',
          occurred_at: currentIsoTime(),
        }),
      })
    } catch {
      // preview remains usable offline
    }
  }

  const handleClearCart = async () => {
    setCart([])
    try {
      await fetch(`${API_BASE}/api/v1/shopper/${selectedCustomerId}/cart`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    } catch {
      // preview remains usable offline
    }
  }

  const handleSimulateCheckout = async () => {
    if (cart.length === 0) return
    setSimulatedCheckout(true)
    try {
      await fetch(`${API_BASE}/api/v1/shopper/${selectedCustomerId}/cart`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    } catch {
      // preview remains usable offline
    }
    setTimeout(() => {
      setCart([])
      setSimulatedCheckout(false)
    }, 2800)
  }

  const getCategoryClass = (category = '') => {
    const cat = category.toLowerCase()
    if (cat.includes('lifestyle')) return 'art-lifestyle'
    if (cat.includes('fashion') || cat.includes('apparel')) return 'art-fashion'
    if (cat.includes('access')) return 'art-accessories'
    if (cat.includes('home') || cat.includes('decor')) return 'art-home'
    if (cat.includes('reward')) return 'art-rewards'
    return 'art-lifestyle'
  }

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0]
  const cartSubtotal = cart.reduce((sum, item) => sum + Number(item.price || 0), 0)

  const content = (
    <div className={isModal ? 'shopper-modal' : 'shopper-card-container'}>
      <header className="shopper-header">
        <div className="shopper-brand-info">
          <span className="eyebrow">MAISON ELORA · LIVE DEMO STOREFRONT</span>
          <h2>Personalized Checkout <span>Experience</span></h2>
        </div>
        <div className="shopper-customer-selector">
          <label htmlFor="customer-select">Target Customer:</label>
          <select
            id="customer-select"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="shopper-customer-dropdown"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.segment || 'Customer'})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="primary-button"
            style={{ padding: '6px 12px', fontSize: '11px', background: '#48a782', color: '#fff' }}
            onClick={() => (onOpenAddProduct ? onOpenAddProduct() : setShowInternalAddModal(true))}
            title="Add new product to storefront catalog"
          >
            <Plus size={13} /> Add item
          </button>
          {isModal && <button className="modal-close" onClick={onClose}>×</button>}
        </div>
      </header>
      <div className="shopper-body">
        <div className="shopper-intro">
          <div>
            <div className="shopper-customer-badge">
              <span className="status-dot" />
              <span>Targeting {activeCustomer?.name || 'Sophie Martin'}</span>
              <span className="customer-segment-tag">{activeCustomer?.segment || 'Loyal'}</span>
            </div>
            <h3>Picked for your next chapter.</h3>
            <p>Personalized from purchase history in PostgreSQL loyum_db and live cart signals.</p>
          </div>
          <div className="cart-summary-group">
            <div className="cart-summary">
              <ShoppingCart size={15} />
              <strong>{cart.length}</strong>
              <span>{cart.length === 1 ? 'item' : 'items'} (${cartSubtotal.toFixed(2)})</span>
            </div>
            {cart.length > 0 && (
              <button className="clear-cart-btn" onClick={handleClearCart} title="Reset Cart">
                Clear
              </button>
            )}
          </div>
        </div>

        {newlyAddedId && (
          <div
            className="shopper-order-alert"
            style={{
              background: 'rgba(72, 167, 130, 0.1)',
              color: '#277055',
              borderColor: '#48a782',
            }}
          >
            <CheckCircle2 size={16} />
            <span>New item successfully added to storefront and listed in catalog!</span>
          </div>
        )}

        {simulatedCheckout && (
          <div className="shopper-order-alert">
            <CheckCircle2 size={16} />
            <span>Simulated checkout completed! Order and cart events synced with loyum_db.</span>
          </div>
        )}

        <div className="shopper-grid">
          {catalog.map((product) => {
            const inCart = cart.some((item) => item.id === product.id)
            return (
              <article className="shopper-product" key={product.id}>
                <div className={`product-art ${getCategoryClass(product.category)}`}>
                  <span className="product-art-glyph">{product.category.slice(0, 1)}</span>
                  <span className="product-art-tag">{product.category}</span>
                </div>
                <div className="product-details">
                  <span className="product-category">{product.category}</span>
                  <h4 title={product.name}>{product.name}</h4>
                  <p title={product.reason}>{product.reason}</p>
                  <div className="product-bottom-lock">
                    <div className="product-price-row">
                      <strong>${Number(product.price).toFixed(2)}</strong>
                      <span className="in-stock-label">In stock</span>
                    </div>
                    <button
                      className={inCart ? 'product-button added' : 'product-button'}
                      onClick={() => addToCart(product)}
                    >
                      {inCart ? (
                        <>Added to cart <CheckCircle2 size={13} /></>
                      ) : (
                        <>Add to cart <Plus size={13} /></>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <footer className="shopper-footer">
        <span>
          <Sparkles size={14} /> Recommendations update in real time after every cart event · Connected to PostgreSQL loyum_db
        </span>
        {cart.length > 0 ? (
          <button className="simulate-checkout-btn" onClick={handleSimulateCheckout}>
            Simulate Checkout (${cartSubtotal.toFixed(2)}) <ArrowUpRight size={14} />
          </button>
        ) : (
          <span className="cart-hint">Add items to test dynamic basket affinity</span>
        )}
      </footer>
    </div>
  )

  return (
    <>
      {isModal ? <div className="shopper-backdrop">{content}</div> : content}
      {showInternalAddModal && (
        <AddProductModal
          onClose={() => setShowInternalAddModal(false)}
          onProductAdded={(newProd) => {
            setNewlyAddedId(newProd.id)
            reloadCatalog()
            if (onProductAddedGlobal) {
              onProductAddedGlobal(newProd)
            }
            setTimeout(() => setNewlyAddedId(null), 5000)
          }}
        />
      )}
    </>
  )
}
