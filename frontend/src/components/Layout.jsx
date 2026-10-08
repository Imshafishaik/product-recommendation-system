import { NavLink } from 'react-router-dom';
import { 
  Home, Users, Package, TrendingUp, CreditCard, 
  Activity, ShieldCheck, PieChart, LogOut 
} from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { to: '/', icon: <Home size={16} />, label: 'Dashboard', end: true },
    ],
  },
  {
    label: 'Data',
    links: [
      { to: '/customers', icon: <Users size={16} />, label: 'Customers' },
      { to: '/products', icon: <Package size={16} />, label: 'Products' },
      { to: '/transactions', icon: <CreditCard size={16} />, label: 'Transactions' },
    ],
  },
  {
    label: 'Intelligence',
    links: [
      { to: '/recommendations', icon: <TrendingUp size={16} />, label: 'Recommendations' },
      { to: '/rfm', icon: <PieChart size={16} />, label: 'RFM & Segmentation' },
      { to: '/retention', icon: <ShieldCheck size={16} />, label: 'Retention Center' },
      { to: '/evaluation', icon: <Activity size={16} />, label: 'Model Evaluation' },
    ],
  },
];

export default function Layout({ children }) {
  const { logout, user } = useContext(AuthContext);

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="app-container">
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🎯</div>
            <h2>RetainPro</h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {user && (
            <div className="user-info-block">
              <div className="user-avatar">{initials}</div>
              <div className="user-email" title={user.email}>{user.email}</div>
            </div>
          )}
          <button className="logout-btn" onClick={logout} id="logout-btn">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
