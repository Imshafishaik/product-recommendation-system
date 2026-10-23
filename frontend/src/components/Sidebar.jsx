import {
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  MoreHorizontal,
  Send,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
} from 'lucide-react'

export default function Sidebar({
  activeTab,
  setActiveTab,
  activeCustomersCount,
  catalogCount = 0,
  onOpenHelp,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">RS</span>
        <span>Recommendation System</span>
      </div>
      {/* <div className="workspace-switcher">
        <span className="workspace-dot"></span>
        <span>Maison Elora</span>
        <ChevronDown size={15} />
      </div> */}
      <nav className="main-nav" aria-label="Main navigation">
        {[
          ['Overview', LayoutDashboard],
          ['Customers', Users],
          ['Recommendations', Sparkles],
          ['Campaigns', Send],
          ['Storefront', Store],
        ].map(([label, Icon]) => (
          <button
            key={label}
            className={activeTab === label ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab(label)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === 'Customers' && <span className="nav-count">{activeCustomersCount}</span>}
            {label === 'Storefront' && catalogCount > 0 && <span className="nav-count">{catalogCount}</span>}
          </button>
        ))}
        <button
          className={activeTab === 'Shopper preview' ? 'nav-item active' : 'nav-item'}
          onClick={() => setActiveTab('Shopper preview')}
        >
          <ShoppingBag size={18} />
          <span>Shopper preview</span>
        </button>
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={onOpenHelp}>
          <CircleHelp size={18} />
          <span>Help center</span>
        </button>
        {/* <div className="profile">
          <div className="avatar avatar-navy">AL</div>
          <div>
            <strong>Amelie Laurent</strong>
            <span>Administrator</span>
          </div>
          <MoreHorizontal size={17} />
        </div> */}
      </div>
    </aside>
  )
}
