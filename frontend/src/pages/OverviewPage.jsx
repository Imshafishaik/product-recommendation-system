import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Filter,
  MoreHorizontal,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { MetricCard } from '../components'

export default function OverviewPage({
  isOverview = true,
  metrics,
  timeRange,
  showDateMenu,
  setShowDateMenu,
  handleTimeRangeSelect,
  setActiveTab,
  filteredCustomers,
  search,
  setSearch,
  segment,
  setSegment,
  setSelectedCustomer,
  studioRecs,
  handleViewAudience,
  handleQueueAtRiskCampaign,
  sentCampaign,
}) {
  return (
    <>
      <section className={isOverview ? 'hero-banner' : 'hidden-page'}>
        <div>
          <span className="eyebrow light">YOUR RETENTION PULSE</span>
          <h2>
            Customer momentum is <em>growing.</em>
          </h2>
          <p>Engagement is up 8.4% this month. Your next best actions are ready.</p>
          <button className="light-button" onClick={() => setActiveTab('Recommendations')}>
            View recommendations <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="pulse-art">
          <div className="pulse-ring ring-one"></div>
          <div className="pulse-ring ring-two"></div>
          <div className="pulse-core">
            <TrendingUp size={24} />
          </div>
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
              <button
                className={timeRange === 'Last 7 days' ? 'active' : ''}
                onClick={() => handleTimeRangeSelect('Last 7 days', '7d')}
              >
                Last 7 days
              </button>
              <button
                className={timeRange === 'Last 30 days' ? 'active' : ''}
                onClick={() => handleTimeRangeSelect('Last 30 days', '30d')}
              >
                Last 30 days
              </button>
              <button
                className={timeRange === 'Last 90 days' ? 'active' : ''}
                onClick={() => handleTimeRangeSelect('Last 90 days', '90d')}
              >
                Last 90 days
              </button>
              <button
                className={timeRange === 'All time' ? 'active' : ''}
                onClick={() => handleTimeRangeSelect('All time', 'all')}
              >
                All time
              </button>
            </div>
          )}
        </div>
      </div>

      <section className={isOverview ? 'metrics-grid' : 'hidden-page'}>
        <MetricCard
          label="Active customers"
          value={metrics.activeCustomers}
          change="+12.6%"
          icon={Users}
          tone="blue"
          detail="vs. previous period"
        />
        <MetricCard
          label="Revenue influenced"
          value={metrics.revenueInfluenced}
          change="+8.4%"
          icon={TrendingUp}
          tone="yellow"
          detail="from recommendations"
        />
        <MetricCard
          label="At-risk customers"
          value={metrics.atRiskCustomers}
          change="-6.2%"
          icon={TrendingDown}
          tone="coral"
          detail="needs your attention"
        />
        <MetricCard
          label="Avg. customer value"
          value={metrics.averageValue}
          change="+4.1%"
          icon={Sparkles}
          tone="green"
          detail="across all segments"
        />
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
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers"
              />
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
                    <td>
                      <span className={`segment-pill ${customer.tone}`}>{customer.segment}</span>
                    </td>
                    <td>
                      <div className="score-cell">
                        <div className="score-bar">
                          <span
                            className={`score-fill ${customer.tone}`}
                            style={{ width: `${customer.score}%` }}
                          ></span>
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
            <button
              className="more-button"
              aria-label="More insights"
              onClick={() => setActiveTab('Recommendations')}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="recommendation-list">
            {studioRecs
              .slice(0, 3)
              .map(({ title, category, uplift, reason, color, icon: Icon, audience_segment }) => (
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
        <span>
          <span className="status-dot"></span> PostgreSQL loyum_db synced · Engine active
        </span>
        <span>Data processed asynchronously · Next refresh in 26 min</span>
      </footer>
    </>
  )
}
