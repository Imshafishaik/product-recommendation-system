import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiGet, apiUploadFile } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Upload, X, Search, RefreshCw } from 'lucide-react';

function CsvModal({ onClose, onSuccess }) {
  const { token } = useContext(AuthContext);
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) setFile(f);
    else addToast('Please drop a .csv file', 'error');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await apiUploadFile('/transactions/upload_csv', file, token);
      addToast(res.message, 'success');
      onSuccess();
      onClose();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Import Transactions CSV</div>
            <div className="modal-subtitle">Links customer_ref + product_ref to create transaction records</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div
            className={`drop-zone ${drag ? 'active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="drop-zone-icon">🛒</div>
            {file
              ? <p style={{ color: 'var(--accent-green)', fontWeight: 600 }}>✓ {file.name}</p>
              : <p>Drag & drop your CSV here, or <strong>click to browse</strong></p>
            }
            <small>Supported format: .csv • Customers & products must be imported first</small>
            <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }}
              onChange={e => setFile(e.target.files[0])} />
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Example CSV format:</strong>
            <pre style={{ marginTop: 6, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
{`transaction_ref,customer_ref,product_ref,quantity
TXN-001,CUST-001,PRD-001,2
TXN-002,CUST-002,PRD-003,1`}
            </pre>
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleUpload} disabled={!file || uploading} id="txn-csv-upload-submit">
            <Upload size={14} />
            {uploading ? 'Importing…' : 'Import CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { token } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/transactions/', token);
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const filtered = transactions.filter(t =>
    t.transaction_ref?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Transactions</h1>
          <p>{transactions.length} total transaction record{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={fetchTransactions} id="refresh-transactions">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="primary-btn" onClick={() => setShowModal(true)} id="import-transactions-btn">
            <Upload size={14} /> Import CSV
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            id="transaction-search"
            className="form-input"
            placeholder="Search by transaction ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading transactions…</div>
        ) : filtered.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">🛒</div>
            <p>{search ? 'No transactions match your search.' : 'No transactions yet.'}</p>
            <small>{!search && 'Import customers & products first, then import transactions.'}</small>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Customer ID</th>
                <th>Product ID</th>
                <th>Quantity</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><code style={{ color: 'var(--accent-cyan)', fontSize: 12 }}>{t.transaction_ref}</code></td>
                  <td style={{ color: 'var(--text-secondary)' }}>#{t.customer_id}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>#{t.product_id}</td>
                  <td><span className="badge info">×{t.quantity}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {t.timestamp ? new Date(t.timestamp).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <CsvModal onClose={() => setShowModal(false)} onSuccess={fetchTransactions} />}
    </div>
  );
}
