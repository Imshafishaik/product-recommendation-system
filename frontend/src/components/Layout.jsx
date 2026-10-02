import { NavLink } from 'react-router-dom';
import { Home, Users, Package, TrendingUp, CreditCard, Activity, Clock, ShieldCheck, PieChart } from 'lucide-react';

export default function Layout({ children }) {
    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>RetainPro</h2>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <Home size={20} /> Dashboard
                    </NavLink>
                    <NavLink to="/customers" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <Users size={20} /> Customers
                    </NavLink>
                    <NavLink to="/products" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <Package size={20} /> Products
                    </NavLink>
                    <NavLink to="/transactions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <CreditCard size={20} /> Transactions
                    </NavLink>
                    <NavLink to="/recommendations" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <TrendingUp size={20} /> Recommendations
                    </NavLink>
                    <NavLink to="/rfm" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <PieChart size={20} /> RFM & Segmentation
                    </NavLink>
                    <NavLink to="/retention" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <ShieldCheck size={20} /> Retention
                    </NavLink>
                    <NavLink to="/jobs" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <Clock size={20} /> Processing Jobs
                    </NavLink>
                    <NavLink to="/evaluation" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                        <Activity size={20} /> Model Evaluation
                    </NavLink>
                </nav>
            </aside>
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}