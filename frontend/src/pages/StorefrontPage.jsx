import { useState } from 'react'
import {
  ArrowUpRight,
  Filter,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
} from 'lucide-react'
import { MiniStat, PageHeader } from '../components'

export default function StorefrontPage({
  products,
  onOpenAddProduct,
  onDeleteProduct,
  onPreviewStorefront,
}) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All categories')

  const categories = [
    'All categories',
    ...Array.from(new Set(products.map((p) => p.category))).filter(Boolean),
  ]

  const filtered = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All categories' || p.category === selectedCategory
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.reason && p.reason.toLowerCase().includes(search.toLowerCase())) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCategoryClass = (category = '') => {
    const cat = category.toLowerCase()
    if (cat.includes('lifestyle')) return 'art-lifestyle'
    if (cat.includes('fashion') || cat.includes('apparel')) return 'art-fashion'
    if (cat.includes('access')) return 'art-accessories'
    if (cat.includes('home') || cat.includes('decor')) return 'art-home'
    if (cat.includes('reward')) return 'art-rewards'
    return 'art-lifestyle'
  }

  const avgPrice =
    products.length > 0
      ? (products.reduce((sum, p) => sum + Number(p.price || 0), 0) / products.length).toFixed(2)
      : '0.00'

  return (
    <section className="page-view">
      <PageHeader
        eyebrow="MERCHANT CATALOG"
        title="Storefront items"
        description="Manage the product catalog displayed in your customer storefront. Items added here appear directly in the Shopper preview and update recommendation scoring."
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="outline-button" onClick={onPreviewStorefront}>
              <ShoppingBag size={15} /> Preview in shopper
            </button>
            <button className="primary-button" onClick={onOpenAddProduct}>
              <Plus size={15} /> Add item to storefront
            </button>
          </div>
        }
      />

      <div className="customer-page-stats">
        <MiniStat label="Total items" value={products.length} />
        <MiniStat
          label="Categories"
          value={Array.from(new Set(products.map((p) => p.category))).length}
        />
        <MiniStat label="Avg. price" value={`$${avgPrice}`} />
        <MiniStat label="Storefront status" value="Active in loyum_db" />
      </div>

      <div className="panel full-panel">
        <div className="customer-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items by name, category, or recommendation reason..."
            />
          </div>
          <div className="select-wrap">
            <Filter size={15} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="shopper-grid" style={{ padding: '20px 24px' }}>
          {filtered.map((product) => (
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
                    <span className="in-stock-label">In storefront</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button
                      className="outline-button"
                      style={{
                        padding: '6px 10px',
                        fontSize: '11px',
                        color: 'var(--coral)',
                        borderColor: 'rgba(235, 107, 86, 0.25)',
                      }}
                      onClick={() => onDeleteProduct(product.id, product.name)}
                      title="Remove product from storefront"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#728285' }}>
              <Store size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3>No storefront items found</h3>
              <p style={{ margin: '6px 0 16px' }}>Try clearing your search query or add a new item.</p>
              <button className="primary-button" onClick={onOpenAddProduct} style={{ margin: '0 auto' }}>
                <Plus size={15} /> Add item now
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
