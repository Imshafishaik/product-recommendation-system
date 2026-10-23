import { PageHeader, ShopperPreview } from '../components'

export default function ShopperPage({ onClose, onOpenAddProduct, onProductAdded }) {
  return (
    <section className="page-view">
      <PageHeader
        eyebrow="END-CUSTOMER EXPERIENCE"
        title="Shopper preview"
        description="Test how the engine turns purchase history and cart activity into checkout recommendations."
        action={
          <span className="live-badge">
            <span className="status-dot" /> Live demo
          </span>
        }
      />
      <ShopperPreview
        onClose={onClose}
        onOpenAddProduct={onOpenAddProduct}
        onProductAddedGlobal={onProductAdded}
      />
    </section>
  )
}
