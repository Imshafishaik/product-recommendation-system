import { Bell } from 'lucide-react'

export default function Topbar({
  user,
  showNotifications,
  setShowNotifications,
  metrics,
  confidence,
  onSignOut,
}) {
  return (
    <header className="topbar">
      <div>
        {/* <span className="eyebrow">MONDAY, 16 JUNE 2025</span> */}
        <h1>
          Welcome, {user?.name?.split(' ')[0] || 'Amelie'} <span className="wave">✦</span>
        </h1>
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
          onClick={onSignOut}
        >
          AL
        </button>
      </div>
    </header>
  )
}
