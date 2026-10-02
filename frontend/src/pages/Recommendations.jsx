import React, { useState } from 'react';

const DUMMY_RECOMMENDATIONS = [
  { id: 10, title: 'Bluetooth Speaker Portable', score: 0.94, reason: 'Similar to "Wireless Noise-Canceling Headphones"' },
  { id: 11, title: 'Leather Laptop Sleeve', score: 0.82, reason: 'Often bought with electronics accessories.' },
  { id: 12, title: 'USB-C Fast Charger', score: 0.78, reason: 'Matches your previous purchase history.' }
];

export default function Recommendations() {
  const [selectedCustomer, setSelectedCustomer] = useState('CUST-001 (Alice Johnson)');

  return (
    <div>
      <header className="page-header">
        <h1>Personalized Recommendations</h1>
      </header>
      
      <div className="filter-bar card">
        <label>Select Customer: </label>
        <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="form-select">
          <option>CUST-001 (Alice Johnson)</option>
          <option>CUST-002 (Bob Smith)</option>
          <option>CUST-003 (Charlie Davis)</option>
        </select>
        <button className="secondary-btn" style={{marginLeft: '10px'}}>Generate via ML Engine</button>
      </div>

      <div className="recommendations-list">
        <h3>Top Content-Based Matches for {selectedCustomer}</h3>
        <div className="rec-grid">
          {DUMMY_RECOMMENDATIONS.map((rec, idx) => (
            <div key={rec.id} className="rec-card">
              <div className="rec-rank">#{idx + 1}</div>
              <div className="rec-content">
                <h4>{rec.title}</h4>
                <p className="rec-reason"><em>Why?</em> {rec.reason}</p>
                <div className="rec-score">Similarity Score: <strong>{(rec.score * 100).toFixed(1)}%</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
