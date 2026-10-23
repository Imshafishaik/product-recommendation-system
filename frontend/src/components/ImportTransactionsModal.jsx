import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react'
import { API_BASE, authHeaders } from '../constants'

export default function ImportTransactionsModal({ onClose, onImportSuccess }) {
  const [mode, setMode] = useState('sample')
  const [file, setFile] = useState(null)
  const [pasteText, setPasteText] = useState('')
  const [transactions, setTransactions] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [jobStatus, setJobStatus] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSample()
  }, [])

  const loadSample = async () => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/transactions/sample`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed to load sample data')
      const data = await res.json()
      setTransactions(data)
    } catch {
      setError('Could not load sample data from backend.')
    }
  }

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setError('')
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      try {
        if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
          const parsed = JSON.parse(text)
          setTransactions(Array.isArray(parsed) ? parsed : [parsed])
        } else {
          const lines = text.trim().split('\n').filter(Boolean)
          if (lines.length > 1) {
            const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
            const parsed = lines.slice(1).map((line) => {
              const vals = line.split(',').map((v) => v.trim().replace(/"/g, ''))
              const obj = {}
              headers.forEach((h, i) => {
                obj[h] = vals[i]
              })
              return {
                customer_id: obj.customer_id || obj.customerid || obj.customer || 'cus_unknown',
                product_id: obj.product_id || obj.productid || obj.product || 'prod_bundle_01',
                amount: parseFloat(obj.amount || obj.price || obj.spend || 50),
                purchased_at: obj.purchased_at || obj.date || new Date().toISOString(),
              }
            })
            setTransactions(parsed)
          }
        }
      } catch (parseErr) {
        setError('Error parsing uploaded file: ' + parseErr.message)
      }
    }
    reader.readAsText(uploadedFile)
  }

  const handlePasteChange = (val) => {
    setPasteText(val)
    setError('')
    try {
      const trimmed = val.trim()
      if (!trimmed) {
        setTransactions([])
        return
      }
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed)
        setTransactions(Array.isArray(parsed) ? parsed : [parsed])
      } else {
        const lines = trimmed.split('\n').filter(Boolean)
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
          const parsed = lines.slice(1).map((line) => {
            const vals = line.split(',').map((v) => v.trim().replace(/"/g, ''))
            const obj = {}
            headers.forEach((h, i) => {
              obj[h] = vals[i]
            })
            return {
              customer_id: obj.customer_id || obj.customerid || obj.customer || 'cus_unknown',
              product_id: obj.product_id || obj.productid || obj.product || 'prod_bundle_01',
              amount: parseFloat(obj.amount || obj.price || obj.spend || 50),
              purchased_at: obj.purchased_at || obj.date || new Date().toISOString(),
            }
          })
          setTransactions(parsed)
        }
      }
    } catch {
      // User may still be typing
    }
  }

  const pollJob = async (jobId) => {
    let attempts = 0
    while (attempts < 15) {
      await new Promise((r) => setTimeout(r, 700))
      try {
        const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`, { headers: authHeaders() })
        if (res.ok) {
          const data = await res.json()
          setJobStatus(data)
          if (data.status === 'completed' || data.status === 'failed') {
            break
          }
        }
      } catch {
        // continue polling
      }
      attempts++
    }
    if (onImportSuccess) {
      onImportSuccess()
    }
  }

  const submitImport = async () => {
    if (!transactions.length) {
      setError('Please provide at least one transaction to import.')
      return
    }
    setSubmitting(true)
    setError('')
    setJobStatus({ status: 'submitting' })

    try {
      const res = await fetch(`${API_BASE}/api/v1/transactions`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify(transactions.map((tx) => ({
          customer_id: tx.customer_id,
          product_id: tx.product_id,
          amount: Number(tx.amount) || 50.0,
          purchased_at: tx.purchased_at || new Date().toISOString(),
        }))),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.detail || 'Import failed')
      setJobStatus({ status: 'queued', job_id: result.job_id, accepted: result.accepted })
      await pollJob(result.job_id)
    } catch (err) {
      setError(err.message)
      setJobStatus(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shopper-backdrop">
      <section className="shopper-modal import-modal">
        <header className="shopper-header">
          <div>
            <span className="eyebrow">TRANSACTION INGESTION PIPELINE</span>
            <h2>Import <span>customer transactions</span></h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </header>

        <div className="shopper-body">
          <div className="import-mode-tabs">
            <button
              className={mode === 'sample' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => { setMode('sample'); loadSample() }}
            >
              <Sparkles size={14} /> Sample batch
            </button>
            <button
              className={mode === 'upload' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => { setMode('upload'); setTransactions([]) }}
            >
              <Upload size={14} /> Upload CSV / JSON
            </button>
            <button
              className={mode === 'paste' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => { setMode('paste'); setTransactions([]) }}
            >
              <FileText size={14} /> Paste raw data
            </button>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          {mode === 'sample' && (
            <div className="import-section-desc">
              <p>
                A ready-to-test batch of fresh transactions, including reactivations for <strong>Lucas Bernard</strong> (At risk) and <strong>Thomas Petit</strong> (Inactive). Ingesting these will update their recency, recompute health scores, and retrain the affinity model in <strong>PostgreSQL loyum_db</strong>.
              </p>
            </div>
          )}

          {mode === 'upload' && (
            <div className="file-dropzone">
              <Upload size={32} />
              <h4>Choose a CSV or JSON file</h4>
              <p>Columns: <code>customer_id, product_id, amount, purchased_at</code></p>
              <label className="file-upload-label">
                Select file
                <input type="file" accept=".csv,.json" onChange={handleFileUpload} />
              </label>
              {file && <span className="selected-file-name">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>}
            </div>
          )}

          {mode === 'paste' && (
            <div className="paste-area">
              <label className="eyebrow">PASTE CSV OR JSON</label>
              <textarea
                rows={5}
                placeholder={"customer_id,product_id,amount,purchased_at\ncus_002,prod_bundle_01,64.00,2026-10-19T14:00:00Z"}
                value={pasteText}
                onChange={(e) => handlePasteChange(e.target.value)}
              />
            </div>
          )}

          {transactions.length > 0 && (
            <div className="preview-wrap">
              <div className="preview-heading">
                <span className="eyebrow">TRANSACTION PREVIEW ({transactions.length} ITEMS)</span>
                <span className="preview-badge">Ready for ingestion</span>
              </div>
              <div className="table-wrap" style={{ maxHeight: 220, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Product ID</th>
                      <th>Amount</th>
                      <th>Purchased At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 8).map((tx, idx) => (
                      <tr key={idx}>
                        <td><strong>{tx.customer_id}</strong></td>
                        <td><span className="category-tag">{tx.product_id}</span></td>
                        <td>${Number(tx.amount).toFixed(2)}</td>
                        <td className="muted">{tx.purchased_at ? tx.purchased_at.slice(0, 19).replace('T', ' ') : 'Now'}</td>
                      </tr>
                    ))}
                    {transactions.length > 8 && (
                      <tr>
                        <td colSpan={4} className="muted" style={{ textAlign: 'center' }}>
                          + {transactions.length - 8} more transactions in batch
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {jobStatus && (
            <div className={`job-status-banner ${jobStatus.status}`}>
              {jobStatus.status === 'submitting' && (
                <span><RefreshCw size={15} className="spin" /> Submitting batch to PostgreSQL loyum_db...</span>
              )}
              {jobStatus.status === 'queued' && (
                <span><Clock3 size={15} /> Job queued in background (Job ID: {jobStatus.job_id})</span>
              )}
              {jobStatus.status === 'processing' && (
                <span><RefreshCw size={15} className="spin" /> Processing RFM recalculation & collaborative filtering model...</span>
              )}
              {jobStatus.status === 'completed' && (
                <span><CheckCircle2 size={16} /> Batch processed! {jobStatus.accepted} transactions saved in PostgreSQL, {jobStatus.customers_scored} customer profiles re-scored.</span>
              )}
              {jobStatus.status === 'failed' && (
                <span><AlertCircle size={16} /> Job processing failed. Check server logs.</span>
              )}
            </div>
          )}
        </div>

        <footer className="shopper-footer">
          <span><Sparkles size={14} /> Background task automatically updates PostgreSQL loyum_db & retrains models</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ opacity: 0.8 }}>Close</button>
            <button
              className="primary-button"
              disabled={submitting || transactions.length === 0}
              onClick={submitImport}
              style={{ background: '#48a782', color: '#fff', padding: '9px 16px' }}
            >
              {submitting ? 'Processing batch...' : 'Ingest & Re-score RFM'} <ArrowUpRight size={14} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
