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
      const res = await apiUploadFile('/customers/upload_csv', file, token);
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
            <div className="modal-title">Import Customers CSV</div>
            <div className="modal-subtitle">Required columns: customer_ref, name, email, segment</div>
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
            <div className="drop-zone-icon">📂</div>
            {file
              ? <p style={{ color: 'var(--accent-green)', fontWeight: 600 }}>✓ {file.name}</p>
              : <p>Drag & drop your CSV here, or <strong>click to browse</strong></p>
            }
            <small>Supported format: .csv • Duplicate customer_refs are skipped</small>
            <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }}
              onChange={e => setFile(e.target.files[0])} />
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Example CSV format:</strong>
            <pre style={{ marginTop: 6, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
{`customer_ref,name,email,segment
CUST-001,Alice Johnson,alice@co.com,Loyal
CUST-002,Bob Smith,bob@co.com,New`}
            </pre>
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleUpload} disabled={!file || uploading} id="csv-upload-submit">
            <Upload size={14} />
            {uploading ? 'Importing…' : 'Import CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SEGMENT_CLASS = {
  Champions: 'champions', Loyal: 'loyal', Active: 'active', 'At-Risk': 'at-risk', New: 'new'
};

export default function Customers() {
  const { token } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/customers/', token);
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_ref?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Customers</h1>
          <p>{customers.length} total customer{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={fetchCustomers} id="refresh-customers">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="primary-btn" onClick={() => setShowModal(true)} id="import-customers-btn">
            <Upload size={14} /> Import CSV
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            id="customer-search"
            className="form-input"
            placeholder="Search by name, email or ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading customers…</div>
        ) : filtered.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">👥</div>
            <p>{search ? 'No customers match your search.' : 'No customers yet.'}</p>
            <small>{!search && 'Click "Import CSV" to add customers.'}</small>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Name</th>
                <th>Email</th>
                <th>RFM Segment</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><code style={{ color: 'var(--accent-cyan)', fontSize: 12 }}>{c.customer_ref}</code></td>
                  <td><strong>{c.name || '—'}</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                  <td>
                    <span className={`segment-badge ${SEGMENT_CLASS[c.segment] || 'new'}`}>
                      {c.segment || 'New'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{c.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <CsvModal onClose={() => setShowModal(false)} onSuccess={fetchCustomers} />}
    </div>
  );
}
