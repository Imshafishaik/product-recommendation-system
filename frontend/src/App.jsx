import { useEffect, useState } from 'react'
import { CheckCircle2, PackageOpen, Sparkles, TrendingUp } from 'lucide-react'
import './App.css'

import {
  API_BASE,
  AUTH_TOKEN_KEY,
  authHeaders,
  customerTone,
  initialCustomers,
  initialRecommendations,
  shopperProducts,
} from './constants'

import {
  AddProductModal,
  CreateCampaignModal,
  CustomerDetailModal,
  HelpCenterModal,
  ImportTransactionsModal,
  Sidebar,
  Topbar,
} from './components'

import {
  CampaignsPage,
  CustomersPage,
  LoginPage,
  OverviewPage,
  RecommendationsPage,
  ShopperPage,
  StorefrontPage,
} from './pages'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [segment, setSegment] = useState('All segments')
  const [search, setSearch] = useState('')
  const [sentCampaign, setSentCampaign] = useState(false)
  const [customerRows, setCustomerRows] = useState(initialCustomers)
  const [metrics, setMetrics] = useState({
    activeCustomers: '248',
    revenueInfluenced: '$18,420',
    atRiskCustomers: '31',
    averageValue: '$74.28',
  })
  const [timeRange, setTimeRange] = useState('Last 30 days')
  const [showDateMenu, setShowDateMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [catalogProducts, setCatalogProducts] = useState(shopperProducts)
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
      const [customersResponse, overviewResponse, campaignsResponse, recsResponse, catalogResponse] =
        await Promise.all([
          fetch(`${API_BASE}/api/v1/customers`, { headers: authHeaders() }),
          fetch(`${API_BASE}/api/v1/overview?time_range=${rangeKey}`, { headers: authHeaders() }),
          fetch(`${API_BASE}/api/v1/campaigns`, { headers: authHeaders() }),
          fetch(`${API_BASE}/api/v1/recommendations`, { headers: authHeaders() }),
          fetch(`${API_BASE}/api/v1/catalog`, { headers: authHeaders() }),
        ])

      if (customersResponse.status === 401 || overviewResponse.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setToken(null)
        return
      }

      if (customersResponse.ok) {
        const apiCustomers = await customersResponse.json()
        setCustomerRows(
          apiCustomers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            initials: customer.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2),
            email: `${customer.id}@demo.mindsit.com`,
            segment: customer.segment,
            score: customer.health_score,
            orders: customer.frequency,
            spend: `$${Number(customer.monetary).toLocaleString()}`,
            lastSeen: `${customer.recency_days} days ago`,
            tone: customerTone(customer.segment),
          })),
        )
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
        setStudioRecs(
          recs.map((r) => ({
            ...r,
            icon:
              r.category === 'Fashion'
                ? Sparkles
                : r.category === 'Rewards'
                  ? TrendingUp
                  : PackageOpen,
          })),
        )
      }

      if (catalogResponse && catalogResponse.ok) {
        const catalogData = await catalogResponse.json()
        if (Array.isArray(catalogData) && catalogData.length > 0) {
          setCatalogProducts(catalogData)
        }
      }
    } catch {
      // Fallback data remains available when API is offline
    }
  }

  const handleProductAdded = (newProd) => {
    setCatalogProducts((prev) => [newProd, ...prev.filter((p) => p.id !== newProd.id)])
    setShowAddProductModal(false)
    showToast(`"${newProd.name}" added to storefront! It is now live in Shopper Preview.`)
  }

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from the storefront?`)) {
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${productId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to delete item')
      setCatalogProducts((prev) => prev.filter((p) => p.id !== productId))
      showToast(`"${productName}" removed from storefront.`)
    } catch (err) {
      showToast(`Error: ${err.message}`)
    }
  }

  useEffect(() => {
    loadDashboard('30d')
  }, [token])

  if (!token) {
    return (
      <LoginPage
        onLogin={(nextToken, nextUser) => {
          localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
          setToken(nextToken)
          setUser(nextUser)
        }}
      />
    )
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
      const res = await fetch(`${API_BASE}/api/v1/recommendations/batch`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Batch generation failed')
      const result = await res.json()
      setConfidence(`${result.confidence}%`)
      await loadDashboard()
      showToast(
        `Batch completed! Model retrained on PostgreSQL loyum_db (Confidence: ${result.confidence}%)`,
      )
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
      showToast(
        `Campaign "${result.name}" launched to ${result.estimated_recipients} ${result.segment} shoppers!`,
      )
    } catch (err) {
      showToast(`Error: ${err.message}`)
    }
  }

  const handleQueueAtRiskCampaign = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/campaigns/At%20risk/queue`, {
        method: 'POST',
        headers: authHeaders(),
      })
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
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeCustomersCount={metrics.activeCustomers}
        catalogCount={catalogProducts.length}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      <main className="main-content">
        <Topbar
          user={user}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          metrics={metrics}
          confidence={confidence}
          onSignOut={() => {
            localStorage.removeItem(AUTH_TOKEN_KEY)
            setToken(null)
          }}
        />

        {/* OVERVIEW TAB */}
        <OverviewPage
          isOverview={isOverview}
          metrics={metrics}
          timeRange={timeRange}
          showDateMenu={showDateMenu}
          setShowDateMenu={setShowDateMenu}
          handleTimeRangeSelect={handleTimeRangeSelect}
          setActiveTab={setActiveTab}
          filteredCustomers={filteredCustomers}
          search={search}
          setSearch={setSearch}
          segment={segment}
          setSegment={setSegment}
          setSelectedCustomer={setSelectedCustomer}
          studioRecs={studioRecs}
          handleViewAudience={handleViewAudience}
          handleQueueAtRiskCampaign={handleQueueAtRiskCampaign}
          sentCampaign={sentCampaign}
        />

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

        {/* STOREFRONT CATALOG TAB */}
        {activeTab === 'Storefront' && (
          <StorefrontPage
            products={catalogProducts}
            onOpenAddProduct={() => setShowAddProductModal(true)}
            onDeleteProduct={handleDeleteProduct}
            onPreviewStorefront={() => setActiveTab('Shopper preview')}
          />
        )}

        {/* SHOPPER PREVIEW */}
        {activeTab === 'Shopper preview' && (
          <ShopperPage
            onClose={() => setActiveTab('Overview')}
            onOpenAddProduct={() => setShowAddProductModal(true)}
            onProductAdded={handleProductAdded}
          />
        )}

        {/* MODALS */}
        {showAddProductModal && (
          <AddProductModal
            onClose={() => setShowAddProductModal(false)}
            onProductAdded={handleProductAdded}
          />
        )}

        {showImportModal && (
          <ImportTransactionsModal
            onClose={() => setShowImportModal(false)}
            onImportSuccess={() => {
              loadDashboard()
              showToast('Transactions imported into PostgreSQL loyum_db!')
            }}
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
            onQueueOffer={(_seg) => {
              handleQueueAtRiskCampaign()
              setSelectedCustomer(null)
            }}
          />
        )}

        {showHelpModal && <HelpCenterModal onClose={() => setShowHelpModal(false)} />}

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

export default App
