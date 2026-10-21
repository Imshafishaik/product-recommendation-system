import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  LayoutDashboard,
  MoreHorizontal,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react'

import './App.css'

const initialCustomers = [
  { id: 'cus_001', name: 'Sophie Martin', initials: 'SM', email: 'sophie.martin@email.com', segment: 'Loyal', score: 92, spend: '$1,284', orders: 28, lastSeen: '2 days ago', tone: 'green' },
  { id: 'cus_002', name: 'Lucas Bernard', initials: 'LB', email: 'lucas.bernard@email.com', segment: 'At risk', score: 48, spend: '$736', orders: 14, lastSeen: '19 days ago', tone: 'orange' },
  { id: 'cus_003', name: 'Emma Dubois', initials: 'ED', email: 'emma.dubois@email.com', segment: 'Loyal', score: 88, spend: '$2,104', orders: 34, lastSeen: '4 days ago', tone: 'green' },
  { id: 'cus_004', name: 'Thomas Petit', initials: 'TP', email: 'thomas.petit@email.com', segment: 'Inactive', score: 21, spend: '$214', orders: 5, lastSeen: '58 days ago', tone: 'red' },
  { id: 'cus_005', name: 'Camille Leroy', initials: 'CL', email: 'camille.leroy@email.com', segment: 'New', score: 64, spend: '$408', orders: 8, lastSeen: '6 days ago', tone: 'blue' },
]

const initialRecommendations = [
  { id: 'rec_01', title: 'Weekend discovery bundle', category: 'Lifestyle', uplift: '+24%', reason: 'Pairs well with recent purchases across lifestyle & home categories', audience_segment: 'Growing', color: 'blue', icon: PackageOpen },
  { id: 'rec_02', title: 'Early access: Spring edit', category: 'Fashion', uplift: '+18%', reason: 'Popular with loyal customers who purchased outerwear in the last 30 days', audience_segment: 'Loyal', color: 'coral', icon: Sparkles },
  { id: 'rec_03', title: 'Double points on essentials', category: 'Rewards', uplift: '+14%', reason: 'Reactivates at-risk shoppers with high repeat propensity', audience_segment: 'At risk', color: 'yellow', icon: TrendingUp },
  { id: 'rec_04', title: 'Linen weekend tote companion', category: 'Accessories', uplift: '+16%', reason: 'High basket co-occurrence with spring edit and discovery bundles', audience_segment: 'New', color: 'green', icon: PackageOpen },
]

const shopperProducts = [
  { id: 'prod_bundle_01', name: 'Weekend discovery bundle', category: 'Lifestyle', price: 64, reason: 'Complements your recent purchases' },
  { id: 'prod_reward_04', name: 'Double points on essentials', category: 'Rewards', price: 42.5, reason: 'Popular with your customer segment' },
  { id: 'prod_spring_02', name: 'Spring edit overshirt', category: 'Fashion', price: 89, reason: 'Frequently bought with your saved items' },
  { id: 'prod_home_07', name: 'Linen weekend tote', category: 'Accessories', price: 36, reason: 'A lightweight match for your basket' },
]

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const AUTH_TOKEN_KEY = 'mindsit_access_token'

function authHeaders(json = false) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

function customerTone(segment) {
  return { Loyal: 'green', 'At risk': 'orange', Inactive: 'red', New: 'blue', Growing: 'blue' }[segment] || 'blue'
}

function currentIsoTime() {
  return new Date().toISOString()
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [segment, setSegment] = useState('All segments')
  const [search, setSearch] = useState('')
  const [sentCampaign, setSentCampaign] = useState(false)
  const [customerRows, setCustomerRows] = useState(initialCustomers)
  const [metrics, setMetrics] = useState({ activeCustomers: '248', revenueInfluenced: '$18,420', atRiskCustomers: '31', averageValue: '$74.28' })
  const [timeRange, setTimeRange] = useState('Last 30 days')
  const [showDateMenu, setShowDateMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [campaignsList, setCampaignsList] = useState([])
  const [studioRecs, setStudioRecs] = useState(initialRecommendations)
  const [confidence, setConfidence] = useState('86%')
  const [generatingBatch, setGeneratingBatch] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const isOverview = activeTab === 'Overview'

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3800)
  }

  const loadDashboard = async (rangeKey = '30d') => {
    if (!token) return
    try {
      const [customersResponse, overviewResponse, campaignsResponse, recsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/v1/customers`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/v1/overview?time_range=${rangeKey}`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/v1/campaigns`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/v1/recommendations`, { headers: authHeaders() }),
      ])

      if (customersResponse.ok) {
        const apiCustomers = await customersResponse.json()
        setCustomerRows(apiCustomers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          initials: customer.name.split(' ').map((part) => part[0]).join('').slice(0, 2),
          email: `${customer.id}@demo.mindsit.com`,
          segment: customer.segment,
          score: customer.health_score,
          orders: customer.frequency,
          spend: `$${Number(customer.monetary).toLocaleString()}`,
          lastSeen: `${customer.recency_days} days ago`,
          tone: customerTone(customer.segment),
        })))
      }

      if (overviewResponse.ok) {
        const overview = await overviewResponse.json()
        setMetrics({
          activeCustomers: String(overview.active_customers),
          revenueInfluenced: `$${Number(overview.revenue_influenced).toLocaleString()}`,
          atRiskCustomers: String(overview.at_risk_customers),
          averageValue: `$${overview.average_customer_value}`,
        })
      }

      if (campaignsResponse.ok) {
        const camps = await campaignsResponse.json()
        setCampaignsList(camps)
      }

      if (recsResponse.ok) {
        const recs = await recsResponse.json()
        setStudioRecs(recs.map((r) => ({
          ...r,
          icon: r.category === 'Fashion' ? Sparkles : r.category === 'Rewards' ? TrendingUp : PackageOpen,
        })))
      }
    } catch {
      // Fallback data remains available when API is offline
    }
  }

  useEffect(() => {
    loadDashboard('30d')
  }, [token])

  if (!token) {
    return <LoginPage onLogin={(nextToken, nextUser) => { localStorage.setItem(AUTH_TOKEN_KEY, nextToken); setToken(nextToken); setUser(nextUser) }} />
  }

  const handleTimeRangeSelect = (label, key) => {
    setTimeRange(label)
    setShowDateMenu(false)
    loadDashboard(key)
    showToast(`Updated performance view for: ${label}`)
  }

  const handleGenerateBatch = async () => {
    setGeneratingBatch(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/recommendations/batch`, { method: 'POST', headers: authHeaders() })
      if (!res.ok) throw new Error('Batch generation failed')
      const result = await res.json()
      setConfidence(`${result.confidence}%`)
      await loadDashboard()
      showToast(`Batch completed! Model retrained on PostgreSQL loyum_db (Confidence: ${result.confidence}%)`)
    } catch (err) {
      showToast(`Error: ${err.message}`)
    } finally {
      setGeneratingBatch(false)
    }
  }

  const handleViewAudience = (audienceSegment) => {
    setActiveTab('Customers')
    setSegment(audienceSegment)
    showToast(`Filtering customers by segment: ${audienceSegment}`)
  }

  const handleCreateCampaign = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/campaigns`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create campaign')
      const result = await res.json()
      setShowCreateCampaign(false)
      await loadDashboard()
      showToast(`Campaign "${result.name}" launched to ${result.estimated_recipients} ${result.segment} shoppers!`)
    } catch (err) {
      showToast(`Error: ${err.message}`)
    }
  }

  const handleQueueAtRiskCampaign = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/campaigns/At%20risk/queue`, { method: 'POST', headers: authHeaders() })
      if (!res.ok) throw new Error('Queueing failed')
      setSentCampaign(true)
      await loadDashboard()
      showToast('Retention campaign queued for at-risk shoppers!')
    } catch {
      setSentCampaign(true)
      showToast('Retention campaign queued!')
    }
  }

  const filteredCustomers = customerRows.filter((customer) => {
    const matchesSegment = segment === 'All segments' || customer.segment === segment
    const matchesSearch = customer.name.toLowerCase().includes(search.toLowerCase())
    return matchesSegment && matchesSearch
  })

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">M</span><span>MindsIT</span></div>
        <div className="workspace-switcher">
          <span className="workspace-dot"></span>
          <span>Maison Elora</span>
          <ChevronDown size={15} />
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          {[
            ['Overview', LayoutDashboard],
            ['Customers', Users],
            ['Recommendations', Sparkles],
            ['Campaigns', Send],
          ].map(([label, Icon]) => (
            <button
              key={label}
              className={activeTab === label ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveTab(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Customers' && <span className="nav-count">{metrics.activeCustomers}</span>}
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
          <button className="nav-item" onClick={() => setShowHelpModal(true)}>
            <CircleHelp size={18} />
            <span>Help center</span>
          </button>
          <div className="profile">
            <div className="avatar avatar-navy">AL</div>
            <div>
              <strong>Amelie Laurent</strong>
              <span>Administrator</span>
            </div>
            <MoreHorizontal size={17} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">MONDAY, 16 JUNE 2025</span>
            <h1>Good morning, {user?.name?.split(' ')[0] || 'Amelie'} <span className="wave">✦</span></h1>
          </div>
          <div className="top-actions" style={{ position: 'relative' }}>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            {showNotifications && (
              <div className="notification-popover">
                <div className="notification-header">
                  <strong>Activity alerts</strong>
                  <span className="status-dot"></span>
                </div>
                <div className="notification-list">
                  <div className="notification-item">
                    <span className="notification-dot-indicator"></span>
                    <div className="notification-text">
                      <strong>PostgreSQL loyum_db active</strong>
                      <p>Connected to localhost:5432 with 7 tables.</p>
                      <span className="notification-time">Just now</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <span className="notification-dot-indicator" style={{ background: 'var(--coral)' }}></span>
                    <div className="notification-text">
                      <strong>{metrics.atRiskCustomers} customers at risk</strong>
                      <p>RFM score dropped below threshold. Action recommended.</p>
                      <span className="notification-time">12 min ago</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <span className="notification-dot-indicator" style={{ background: 'var(--green)' }}></span>
                    <div className="notification-text">
                      <strong>Recommendation model ready</strong>
                      <p>Affinity matrix evaluated with {confidence} confidence.</p>
                      <span className="notification-time">35 min ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              className="top-avatar"
              title="Click to sign out"
              onClick={() => { localStorage.removeItem(AUTH_TOKEN_KEY); setToken(null) }}
            >
              AL
            </button>
          </div>
        </header>

        {/* OVERVIEW TAB */}
        <section className={isOverview ? 'hero-banner' : 'hidden-page'}>
          <div>
            <span className="eyebrow light">YOUR RETENTION PULSE</span>
            <h2>Customer momentum is <em>growing.</em></h2>
            <p>Engagement is up 8.4% this month. Your next best actions are ready.</p>
            <button className="light-button" onClick={() => setActiveTab('Recommendations')}>
              View recommendations <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="pulse-art">
            <div className="pulse-ring ring-one"></div>
            <div className="pulse-ring ring-two"></div>
            <div className="pulse-core"><TrendingUp size={24} /></div>
            <span className="art-label">+8.4%</span>
          </div>
        </section>

        <div className={isOverview ? 'section-heading' : 'hidden-page'}>
          <div>
            <span className="eyebrow">AT A GLANCE</span>
            <h2>Performance overview</h2>
          </div>
          <div className="date-dropdown-wrap">
            <button className="date-button" onClick={() => setShowDateMenu(!showDateMenu)}>
              <Clock3 size={16} /> {timeRange} <ChevronDown size={15} />
            </button>
            {showDateMenu && (
              <div className="date-menu">
                <button className={timeRange === 'Last 7 days' ? 'active' : ''} onClick={() => handleTimeRangeSelect('Last 7 days', '7d')}>Last 7 days</button>
                <button className={timeRange === 'Last 30 days' ? 'active' : ''} onClick={() => handleTimeRangeSelect('Last 30 days', '30d')}>Last 30 days</button>
                <button className={timeRange === 'Last 90 days' ? 'active' : ''} onClick={() => handleTimeRangeSelect('Last 90 days', '90d')}>Last 90 days</button>
                <button className={timeRange === 'All time' ? 'active' : ''} onClick={() => handleTimeRangeSelect('All time', 'all')}>All time</button>
              </div>
            )}
          </div>
        </div>

        <section className={isOverview ? 'metrics-grid' : 'hidden-page'}>
          <MetricCard label="Active customers" value={metrics.activeCustomers} change="+12.6%" icon={Users} tone="blue" detail="vs. previous period" />
          <MetricCard label="Revenue influenced" value={metrics.revenueInfluenced} change="+8.4%" icon={TrendingUp} tone="yellow" detail="from recommendations" />
          <MetricCard label="At-risk customers" value={metrics.atRiskCustomers} change="-6.2%" icon={TrendingDown} tone="coral" detail="needs your attention" />
          <MetricCard label="Avg. customer value" value={metrics.averageValue} change="+4.1%" icon={Sparkles} tone="green" detail="across all segments" />
        </section>

        <section className={isOverview ? 'content-grid' : 'hidden-page'}>
          <div className="panel customers-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">CUSTOMER HEALTH</span>
                <h2>Customers to watch</h2>
              </div>
              <button className="text-button" onClick={() => setActiveTab('Customers')}>
                View all <ArrowUpRight size={15} />
              </button>
            </div>
            <div className="customer-toolbar">
              <div className="search-field">
                <Search size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" />
              </div>
              <div className="select-wrap">
                <Filter size={15} />
                <select value={segment} onChange={(event) => setSegment(event.target.value)}>
                  <option>All segments</option>
                  <option>Loyal</option>
                  <option>At risk</option>
                  <option>Inactive</option>
                  <option>New</option>
                </select>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Segment</th>
                    <th>Health score</th>
                    <th>Last seen</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.slice(0, 5).map((customer) => (
                    <tr key={customer.email}>
                      <td>
                        <div className="customer-cell">
                          <div className={`avatar avatar-${customer.tone}`}>{customer.initials}</div>
                          <div>
                            <strong>{customer.name}</strong>
                            <span>{customer.email}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className={`segment-pill ${customer.tone}`}>{customer.segment}</span></td>
                      <td>
                        <div className="score-cell">
                          <div className="score-bar">
                            <span className={`score-fill ${customer.tone}`} style={{ width: `${customer.score}%` }}></span>
                          </div>
                          <strong>{customer.score}</strong>
                        </div>
                      </td>
                      <td className="muted">{customer.lastSeen}</td>
                      <td>
                        <button
                          className="row-button"
                          aria-label={`Open ${customer.name}`}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel insights-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SMART INSIGHTS</span>
                <h2>Recommended next</h2>
              </div>
              <button className="more-button" aria-label="More insights" onClick={() => setActiveTab('Recommendations')}>
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="recommendation-list">
              {studioRecs.slice(0, 3).map(({ title, category, uplift, reason, color, icon: Icon, audience_segment }) => (
                <div
                  className="recommendation"
                  key={title}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleViewAudience(audience_segment)}
                >
                  <div className={`recommendation-icon ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="recommendation-copy">
                    <div>
                      <strong>{title}</strong>
                      <span className="category-tag">{category}</span>
                    </div>
                    <p>{reason}</p>
                  </div>
                  <span className="uplift">{uplift}</span>
                </div>
              ))}
            </div>
            <div className="campaign-callout">
              <div>
                <span className="eyebrow">RETENTION CAMPAIGN</span>
                <strong>{metrics.atRiskCustomers} customers are losing momentum</strong>
                <p>Send a tailored offer before they drift away.</p>
              </div>
              <button className="send-button" onClick={handleQueueAtRiskCampaign}>
                {sentCampaign ? 'Campaign queued' : 'Review campaign'} <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </section>

        <footer className={isOverview ? '' : 'hidden-page'}>
          <span><span className="status-dot"></span> PostgreSQL loyum_db synced · Engine active</span>
          <span>Data processed asynchronously · Next refresh in 26 min</span>
        </footer>

        {/* CUSTOMERS TAB */}
        {activeTab === 'Customers' && (
          <CustomersPage
            customers={customerRows}
            search={search}
            setSearch={setSearch}
            segment={segment}
            setSegment={setSegment}
            onOpenImport={() => setShowImportModal(true)}
            onSelectCustomer={(c) => setSelectedCustomer(c)}
          />
        )}

        {/* RECOMMENDATIONS TAB */}
        {activeTab === 'Recommendations' && (
          <RecommendationsPage
            recommendations={studioRecs}
            confidence={confidence}
            generatingBatch={generatingBatch}
            onGenerateBatch={handleGenerateBatch}
            onViewAudience={handleViewAudience}
          />
        )}

        {/* CAMPAIGNS TAB */}
        {activeTab === 'Campaigns' && (
          <CampaignsPage
            metrics={metrics}
            campaigns={campaignsList}
            sentCampaign={sentCampaign}
            onOpenCreate={() => setShowCreateCampaign(true)}
            onQueueAtRisk={handleQueueAtRiskCampaign}
          />
        )}

        {/* SHOPPER PREVIEW */}
        {activeTab === 'Shopper preview' && <ShopperPage onClose={() => setActiveTab('Overview')} />}

        {/* MODALS */}
        {showImportModal && (
          <ImportTransactionsModal
            onClose={() => setShowImportModal(false)}
            onImportSuccess={() => { loadDashboard(); showToast('Transactions imported into PostgreSQL loyum_db!') }}
          />
        )}

        {showCreateCampaign && (
          <CreateCampaignModal
            metrics={metrics}
            onClose={() => setShowCreateCampaign(false)}
            onCreate={handleCreateCampaign}
          />
        )}

        {selectedCustomer && (
          <CustomerDetailModal
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            onQueueOffer={(seg) => { handleQueueAtRiskCampaign(); setSelectedCustomer(null) }}
          />
        )}

        {showHelpModal && (
          <HelpCenterModal onClose={() => setShowHelpModal(false)} />
        )}

        {/* FLOATING TOAST */}
        {toastMessage && (
          <div className="toast-banner">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>
    </div>
  )
}

function MetricCard({ label, value, change, icon: Icon, tone, detail }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-meta">
        <span className={tone === 'coral' ? 'negative' : 'positive'}>{change}</span>
        <span>{detail}</span>
      </div>
    </article>
  )
}

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('demo@mindsit.com')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup'
      const body = mode === 'login' ? { email, password } : { name, email, password }
      const response = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || 'Unable to sign in')
      onLogin(result.access_token, result.user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand auth-brand"><span className="brand-mark">M</span><span>MindsIT</span></div>
        <div className="auth-copy">
          <span className="eyebrow">RECOMMENDATION ENGINE</span>
          <h1>{mode === 'login' ? 'Make every customer moment count.' : 'Start growing with customer intelligence.'}</h1>
          <p>{mode === 'login' ? 'Sign in to monitor customer momentum, activate retention campaigns, and tune your next-best recommendations.' : 'Create a workspace account to explore segmentation, recommendations, and retention workflows.'}</p>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <label>Your name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Amelie Laurent" required /></label>
          )}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>
          {error && <div className="auth-error">{error}</div>}
          <button className="primary-button auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in to workspace' : 'Create workspace account'} <ArrowUpRight size={15} />
          </button>
        </form>
        <div className="auth-switch">
          {mode === 'login' ? 'New to MindsIT?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button>
        </div>
        {mode === 'login' && (
          <div className="demo-hint"><span>Demo workspace</span><strong>demo@mindsit.com · demo123</strong></div>
        )}
      </section>
      <div className="auth-art">
        <div className="auth-art-ring ring-one"></div>
        <div className="auth-art-ring ring-two"></div>
        <div className="auth-art-core"><Sparkles size={28} /></div>
        <span className="auth-art-label">+8.4%<small>momentum</small></span>
      </div>
    </main>
  )
}

function ShopperPreview({ onClose, isModal = false }) {
  const [cart, setCart] = useState([])
  const [catalog, setCatalog] = useState(shopperProducts)
  const [selectedCustomerId, setSelectedCustomerId] = useState('cus_001')
  const [customers, setCustomers] = useState(initialCustomers)
  const [simulatedCheckout, setSimulatedCheckout] = useState(false)

  // Load real customer list from postgres database
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/customers`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.customers && data.customers.length > 0) {
          setCustomers(data.customers.slice(0, 10))
        }
      })
      .catch(() => {})
  }, [])

  // Fetch catalog or personalized recommendations for selected customer
  useEffect(() => {
    const cartIds = cart.map((p) => p.id).join(',')
    const url = cartIds
      ? `${API_BASE}/api/v1/shopper/${selectedCustomerId}/recommendations?cart_product_ids=${cartIds}`
      : `${API_BASE}/api/v1/catalog`

    fetch(url, { headers: authHeaders() })
      .then((response) => (response.ok ? response.json() : shopperProducts))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data)
        }
      })
      .catch(() => setCatalog(shopperProducts))
  }, [selectedCustomerId, cart])

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

  const handleSimulateCheckout = () => {
    if (cart.length === 0) return
    setSimulatedCheckout(true)
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
              <button className="clear-cart-btn" onClick={() => setCart([])} title="Reset Cart">
                Clear
              </button>
            )}
          </div>
        </div>

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

  if (isModal) {
    return (
      <div className="shopper-backdrop">
        {content}
      </div>
    )
  }

  return content
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

function CustomersPage({ customers: rows, search, setSearch, segment, setSegment, onOpenImport, onSelectCustomer }) {
  const filtered = rows.filter((customer) => (segment === 'All segments' || customer.segment === segment) && customer.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <section className="page-view">
      <PageHeader
        eyebrow="CUSTOMER INTELLIGENCE"
        title="All customers"
        description="Monitor engagement, value, and retention risk across your customer base in PostgreSQL loyum_db."
        action={
          <button className="primary-button" onClick={onOpenImport}>
            <Upload size={15} /> Import transactions
          </button>
        }
      />
      <div className="customer-page-stats">
        <MiniStat label="Total customers" value={rows.length} />
        <MiniStat label="Loyal customers" value={rows.filter((row) => row.segment === 'Loyal').length} />
        <MiniStat label="At risk" value={rows.filter((row) => row.segment === 'At risk').length} />
        <MiniStat label="Avg. health" value={`${Math.round(rows.reduce((sum, row) => sum + row.score, 0) / (rows.length || 1))} / 100`} />
      </div>
      <div className="panel full-panel">
        <div className="customer-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" />
          </div>
          <div className="select-wrap">
            <Filter size={15} />
            <select value={segment} onChange={(event) => setSegment(event.target.value)}>
              <option>All segments</option>
              <option>Loyal</option>
              <option>At risk</option>
              <option>Inactive</option>
              <option>New</option>
              <option>Growing</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Segment</th>
                <th>Health score</th>
                <th>Last seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.email}>
                  <td>
                    <div className="customer-cell">
                      <div className={`avatar avatar-${customer.tone}`}>{customer.initials}</div>
                      <div>
                        <strong>{customer.name}</strong>
                        <span>{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className={`segment-pill ${customer.tone}`}>{customer.segment}</span></td>
                  <td>
                    <div className="score-cell">
                      <div className="score-bar"><span className={`score-fill ${customer.tone}`} style={{ width: `${customer.score}%` }} /></div>
                      <strong>{customer.score}</strong>
                    </div>
                  </td>
                  <td className="muted">{customer.lastSeen}</td>
                  <td>
                    <button
                      className="row-button"
                      title="View Customer Profile & History"
                      onClick={() => onSelectCustomer(customer)}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function MiniStat({ label, value }) {
  return <div className="mini-stat"><span>{label}</span><strong>{value}</strong></div>
}

function RecommendationsPage({ recommendations, confidence, generatingBatch, onGenerateBatch, onViewAudience }) {
  return (
    <section className="page-view">
      <PageHeader
        eyebrow="RECOMMENDATION STUDIO"
        title="Personalized recommendations"
        description="Review the next-best products and rewards generated from customer behavior."
        action={
          <button
            className="primary-button"
            disabled={generatingBatch}
            onClick={onGenerateBatch}
          >
            {generatingBatch ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} />}
            {generatingBatch ? 'Retraining model...' : 'Generate batch'}
          </button>
        }
      />
      <div className="recommendation-hero">
        <div>
          <span className="eyebrow light">MODEL PERFORMANCE</span>
          <h3>Item-to-item affinity is performing well.</h3>
          <p>Collaborative filtering is trained directly on purchase history in PostgreSQL loyum_db.</p>
        </div>
        <div className="model-score">
          <strong>{confidence}</strong>
          <span>confidence</span>
        </div>
      </div>
      <div className="recommendation-page-grid">
        {recommendations.map(({ title, category, uplift, reason, color, icon: Icon, audience_segment, audience_count }) => (
          <article className="large-recommendation" key={title}>
            <div className={`recommendation-icon ${color}`}>
              <Icon size={20} />
            </div>
            <span className="product-category">{category}</span>
            <h3>{title}</h3>
            <p>{reason}</p>
            <div className="recommendation-footer">
              <span>Predicted uplift</span>
              <strong>{uplift}</strong>
            </div>
            <button className="outline-button" onClick={() => onViewAudience(audience_segment)}>
              View audience ({audience_count ? `${audience_count} ${audience_segment}` : audience_segment}) <ArrowUpRight size={14} />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function CampaignsPage({ metrics, campaigns, sentCampaign, onOpenCreate, onQueueAtRisk }) {
  const displayCampaigns = campaigns.length > 0 ? campaigns : [
    { campaign_id: 'cmp_1001', name: 'Spring loyalty preview', segment: 'Loyal', status: 'sent', lift_rate: '25%', created_at: '2 days ago' },
    { campaign_id: 'cmp_1002', name: 'Welcome reward', segment: 'New', status: 'sent', lift_rate: '18%', created_at: '9 days ago' },
    { campaign_id: 'cmp_1003', name: 'At-risk winback', segment: 'At risk', status: 'draft', lift_rate: 'Ready', created_at: '32 recipients' },
  ]

  return (
    <section className="page-view">
      <PageHeader
        eyebrow="RETENTION AUTOMATION"
        title="Campaigns"
        description="Turn declining engagement signals into timely, targeted customer actions."
        action={
          <button className="primary-button" onClick={onOpenCreate}>
            <Send size={15} /> Create campaign
          </button>
        }
      />
      <div className="campaign-grid">
        <article className="campaign-feature">
          <div className="campaign-feature-top">
            <span className="segment-pill orange">Needs attention</span>
            <span className="eyebrow">RFM TRIGGER</span>
          </div>
          <h3>Bring back customers losing momentum</h3>
          <p>{metrics.atRiskCustomers} customers have not returned within their expected purchase interval. A personalized reward can bring them back.</p>
          <div className="campaign-metrics">
            <div><strong>{metrics.atRiskCustomers}</strong><span>recipients</span></div>
            <div><strong>+18%</strong><span>expected lift</span></div>
            <div><strong>Today</strong><span>recommended send</span></div>
          </div>
          <button className="primary-button" onClick={onQueueAtRisk}>
            {sentCampaign ? 'Campaign queued' : 'Review & queue campaign'} <ArrowUpRight size={15} />
          </button>
        </article>
        <div className="campaign-list">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h2>Campaign history</h2>
            </div>
            <button className="text-button" onClick={onOpenCreate}>+ New</button>
          </div>
          {displayCampaigns.map((camp) => (
            <div className="campaign-row" key={camp.campaign_id}>
              <div className={`campaign-status ${camp.status === 'draft' ? 'draft' : ''}`}></div>
              <div>
                <strong>{camp.name}</strong>
                <span>
                  {camp.status === 'draft' ? `Draft · ${camp.estimated_recipients || 32} recipients` : `${camp.segment} segment · ${camp.estimated_recipients || 45} sent`}
                </span>
              </div>
              <span className="campaign-rate">{camp.lift_rate || 'Ready'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CreateCampaignModal({ metrics, onClose, onCreate }) {
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

function CustomerDetailModal({ customer, onClose, onQueueOffer }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/customers/${customer.id}`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : null)
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

function HelpCenterModal({ onClose }) {
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

function ShopperPage({ onClose }) {
  return (
    <section className="page-view">
      <PageHeader
        eyebrow="END-CUSTOMER EXPERIENCE"
        title="Shopper preview"
        description="Test how the engine turns purchase history and cart activity into checkout recommendations."
        action={<span className="live-badge"><span className="status-dot" /> Live demo</span>}
      />
      <ShopperPreview onClose={onClose} />
    </section>
  )
}

function ImportTransactionsModal({ onClose, onImportSuccess }) {
  const [mode, setMode] = useState('sample')
  const [file, setFile] = useState(null)
  const [pasteText, setPasteText] = useState('')
  const [transactions, setTransactions] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [jobStatus, setJobStatus] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSample()
  }, [])

  const loadSample = async () => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/transactions/sample`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to load sample data')
      const data = await res.json()
      setTransactions(data)
    } catch {
      setError('Could not load sample data from backend.')
    }
  }

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setError('')
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      try {
        if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
          const parsed = JSON.parse(text)
          setTransactions(Array.isArray(parsed) ? parsed : [parsed])
        } else {
          const lines = text.trim().split('\n').filter(Boolean)
          if (lines.length > 1) {
            const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
            const parsed = lines.slice(1).map((line) => {
              const vals = line.split(',').map((v) => v.trim().replace(/"/g, ''))
              const obj = {}
              headers.forEach((h, i) => {
                obj[h] = vals[i]
              })
              return {
                customer_id: obj.customer_id || obj.customerid || obj.customer || 'cus_unknown',
                product_id: obj.product_id || obj.productid || obj.product || 'prod_bundle_01',
                amount: parseFloat(obj.amount || obj.price || obj.spend || 50),
                purchased_at: obj.purchased_at || obj.date || new Date().toISOString(),
              }
            })
            setTransactions(parsed)
          }
        }
      } catch (parseErr) {
        setError('Error parsing uploaded file: ' + parseErr.message)
      }
    }
    reader.readAsText(uploadedFile)
  }

  const handlePasteChange = (val) => {
    setPasteText(val)
    setError('')
    try {
      const trimmed = val.trim()
      if (!trimmed) {
        setTransactions([])
        return
      }
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed)
        setTransactions(Array.isArray(parsed) ? parsed : [parsed])
      } else {
        const lines = trimmed.split('\n').filter(Boolean)
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
          const parsed = lines.slice(1).map((line) => {
            const vals = line.split(',').map((v) => v.trim().replace(/"/g, ''))
            const obj = {}
            headers.forEach((h, i) => {
              obj[h] = vals[i]
            })
            return {
              customer_id: obj.customer_id || obj.customerid || obj.customer || 'cus_unknown',
              product_id: obj.product_id || obj.productid || obj.product || 'prod_bundle_01',
              amount: parseFloat(obj.amount || obj.price || obj.spend || 50),
              purchased_at: obj.purchased_at || obj.date || new Date().toISOString(),
            }
          })
          setTransactions(parsed)
        }
      }
    } catch {
      // User may still be typing
    }
  }

  const pollJob = async (jobId) => {
    let attempts = 0
    while (attempts < 15) {
      await new Promise((r) => setTimeout(r, 700))
      try {
        const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`, { headers: authHeaders() })
        if (res.ok) {
          const data = await res.json()
          setJobStatus(data)
          if (data.status === 'completed' || data.status === 'failed') {
            break
          }
        }
      } catch {
        // continue polling
      }
      attempts++
    }
    if (onImportSuccess) {
      onImportSuccess()
    }
  }

  const submitImport = async () => {
    if (!transactions.length) {
      setError('Please provide at least one transaction to import.')
      return
    }
    setSubmitting(true)
    setError('')
    setJobStatus({ status: 'submitting' })

    try {
      const res = await fetch(`${API_BASE}/api/v1/transactions`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify(transactions.map((tx) => ({
          customer_id: tx.customer_id,
          product_id: tx.product_id,
          amount: Number(tx.amount) || 50.0,
          purchased_at: tx.purchased_at || new Date().toISOString(),
        }))),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.detail || 'Import failed')
      setJobStatus({ status: 'queued', job_id: result.job_id, accepted: result.accepted })
      await pollJob(result.job_id)
    } catch (err) {
      setError(err.message)
      setJobStatus(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shopper-backdrop">
      <section className="shopper-modal import-modal">
        <header className="shopper-header">
          <div>
            <span className="eyebrow">TRANSACTION INGESTION PIPELINE</span>
            <h2>Import <span>customer transactions</span></h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </header>

        <div className="shopper-body">
          <div className="import-mode-tabs">
            <button
              className={mode === 'sample' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => { setMode('sample'); loadSample() }}
            >
              <Sparkles size={14} /> Sample batch
            </button>
            <button
              className={mode === 'upload' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => { setMode('upload'); setTransactions([]) }}
            >
              <Upload size={14} /> Upload CSV / JSON
            </button>
            <button
              className={mode === 'paste' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => { setMode('paste'); setTransactions([]) }}
            >
              <FileText size={14} /> Paste raw data
            </button>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          {mode === 'sample' && (
            <div className="import-section-desc">
              <p>
                A ready-to-test batch of fresh transactions, including reactivations for <strong>Lucas Bernard</strong> (At risk) and <strong>Thomas Petit</strong> (Inactive). Ingesting these will update their recency, recompute health scores, and retrain the affinity model in <strong>PostgreSQL loyum_db</strong>.
              </p>
            </div>
          )}

          {mode === 'upload' && (
            <div className="file-dropzone">
              <Upload size={32} />
              <h4>Choose a CSV or JSON file</h4>
              <p>Columns: <code>customer_id, product_id, amount, purchased_at</code></p>
              <label className="file-upload-label">
                Select file
                <input type="file" accept=".csv,.json" onChange={handleFileUpload} />
              </label>
              {file && <span className="selected-file-name">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>}
            </div>
          )}

          {mode === 'paste' && (
            <div className="paste-area">
              <label className="eyebrow">PASTE CSV OR JSON</label>
              <textarea
                rows={5}
                placeholder={"customer_id,product_id,amount,purchased_at\ncus_002,prod_bundle_01,64.00,2026-10-19T14:00:00Z"}
                value={pasteText}
                onChange={(e) => handlePasteChange(e.target.value)}
              />
            </div>
          )}

          {transactions.length > 0 && (
            <div className="preview-wrap">
              <div className="preview-heading">
                <span className="eyebrow">TRANSACTION PREVIEW ({transactions.length} ITEMS)</span>
                <span className="preview-badge">Ready for ingestion</span>
              </div>
              <div className="table-wrap" style={{ maxHeight: 220, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Product ID</th>
                      <th>Amount</th>
                      <th>Purchased At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 8).map((tx, idx) => (
                      <tr key={idx}>
                        <td><strong>{tx.customer_id}</strong></td>
                        <td><span className="category-tag">{tx.product_id}</span></td>
                        <td>${Number(tx.amount).toFixed(2)}</td>
                        <td className="muted">{tx.purchased_at ? tx.purchased_at.slice(0, 19).replace('T', ' ') : 'Now'}</td>
                      </tr>
                    ))}
                    {transactions.length > 8 && (
                      <tr>
                        <td colSpan={4} className="muted" style={{ textAlign: 'center' }}>
                          + {transactions.length - 8} more transactions in batch
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {jobStatus && (
            <div className={`job-status-banner ${jobStatus.status}`}>
              {jobStatus.status === 'submitting' && (
                <span><RefreshCw size={15} className="spin" /> Submitting batch to PostgreSQL loyum_db...</span>
              )}
              {jobStatus.status === 'queued' && (
                <span><Clock3 size={15} /> Job queued in background (Job ID: {jobStatus.job_id})</span>
              )}
              {jobStatus.status === 'processing' && (
                <span><RefreshCw size={15} className="spin" /> Processing RFM recalculation & collaborative filtering model...</span>
              )}
              {jobStatus.status === 'completed' && (
                <span><CheckCircle2 size={16} /> Batch processed! {jobStatus.accepted} transactions saved in PostgreSQL, {jobStatus.customers_scored} customer profiles re-scored.</span>
              )}
              {jobStatus.status === 'failed' && (
                <span><AlertCircle size={16} /> Job processing failed. Check server logs.</span>
              )}
            </div>
          )}
        </div>

        <footer className="shopper-footer">
          <span><Sparkles size={14} /> Background task automatically updates PostgreSQL loyum_db & retrains models</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ opacity: 0.8 }}>Close</button>
            <button
              className="primary-button"
              disabled={submitting || transactions.length === 0}
              onClick={submitImport}
              style={{ background: '#48a782', color: '#fff', padding: '9px 16px' }}
            >
              {submitting ? 'Processing batch...' : 'Ingest & Re-score RFM'} <ArrowUpRight size={14} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}

export default App
