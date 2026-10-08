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
      const res = await apiUploadFile('/products/upload_csv', file, token);
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
            <div className="modal-title">Import Products CSV</div>
            <div className="modal-subtitle">Required columns: product_ref, title. Optional: category, brand, price, tags, description</div>
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
            <div className="drop-zone-icon">📦</div>
            {file
              ? <p style={{ color: 'var(--accent-green)', fontWeight: 600 }}>✓ {file.name}</p>
              : <p>Drag & drop your CSV here, or <strong>click to browse</strong></p>
            }
            <small>Supported format: .csv • Duplicate product_refs are skipped</small>
            <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }}
              onChange={e => setFile(e.target.files[0])} />
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Example CSV format:</strong>
            <pre style={{ marginTop: 6, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
{`product_ref,title,category,brand,price,tags,in_stock
PRD-001,Wireless Headphones,Electronics,Sony,299.99,audio wireless,true
PRD-002,Office Chair,Furniture,Herman,449.00,ergonomic office,true`}
            </pre>
          </div>
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleUpload} disabled={!file || uploading} id="products-csv-upload-submit">
            <Upload size={14} />
            {uploading ? 'Importing…' : 'Import CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/products/', token);
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.product_ref?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Products</h1>
          <p>{products.length} products in catalog</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={fetchProducts} id="refresh-products">
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="primary-btn" onClick={() => setShowModal(true)} id="import-products-btn">
            <Upload size={14} /> Import CSV
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            id="product-search"
            className="form-input"
            placeholder="Search by title, category, brand or ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📦</div>
            <p>{search ? 'No products match your search.' : 'No products yet.'}</p>
            <small>{!search && 'Click "Import CSV" to add your product catalog.'}</small>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Title</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><code style={{ color: 'var(--accent-cyan)', fontSize: 12 }}>{p.product_ref}</code></td>
                  <td><strong>{p.title}</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.category || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.brand || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                    {p.price != null ? `$${Number(p.price).toFixed(2)}` : '—'}
                  </td>
                  <td>
                    {p.in_stock
                      ? <span className="badge success">In Stock</span>
                      : <span className="badge danger">Out of Stock</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <CsvModal onClose={() => setShowModal(false)} onSuccess={fetchProducts} />}
    </div>
  );
}
