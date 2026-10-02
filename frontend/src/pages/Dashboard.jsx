import React from 'react';

export default function Dashboard() {
  return (
    <div>
      <header className="page-header">
        <h1>Overview Dashboard</h1>
        <div className="status-badge">System Status: Optimal</div>
      </header>
      
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Customers</h3>
          <p className="kpi-value">1,245</p>
          <span className="kpi-trend positive">+12% this month</span>
        </div>
        <div className="kpi-card">
          <h3>Active Products</h3>
          <p className="kpi-value">432</p>
          <span className="kpi-trend">Stable</span>
        </div>
        <div className="kpi-card">
          <h3>At-Risk Customers</h3>
          <p className="kpi-value warning">89</p>
          <span className="kpi-trend negative">Requires attention</span>
        </div>
        <div className="kpi-card">
          <h3>Recommendation Hits</h3>
          <p className="kpi-value">8,392</p>
          <span className="kpi-trend positive">+24% CTR</span>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-placeholder">
          <h3>RFM Segments Distribution</h3>
          <div className="mock-chart">Pie Chart Placeholder</div>
        </div>
        <div className="chart-placeholder">
          <h3>Recent Processing Jobs</h3>
          <table className="data-table">
            <thead>
              <tr><th>Job ID</th><th>Type</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>job_99x2</td><td>RFM Calculate</td><td><span className="badge success">Success</span></td></tr>
              <tr><td>job_99x3</td><td>TF-IDF Vectors</td><td><span className="badge success">Success</span></td></tr>
              <tr><td>job_99x4</td><td>CSV Import</td><td><span className="badge pending">Running</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
