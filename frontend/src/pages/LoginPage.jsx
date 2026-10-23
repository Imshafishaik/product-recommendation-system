import { useState } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { API_BASE } from '../constants'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('demo@mindsit.com')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup'
      const body = mode === 'login' ? { email, password } : { name, email, password }
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || 'Unable to sign in')
      onLogin(result.access_token, result.user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">RS</span>
          <span>Recommendation System</span>
        </div>
        <div className="auth-copy">
          <span className="eyebrow">RECOMMENDATION ENGINE</span>
          <h1>
            {mode === 'login'
              ? 'Make every customer moment count.'
              : 'Start growing with customer intelligence.'}
          </h1>
          <p>
            {mode === 'login'
              ? 'Sign in to monitor customer momentum, activate retention campaigns, and tune your next-best recommendations.'
              : 'Create a workspace account to explore segmentation, recommendations, and retention workflows.'}
          </p>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <label>
              Your name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Amelie Laurent"
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="primary-button auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in to workspace' : 'Create workspace account'}{' '}
            <ArrowUpRight size={15} />
          </button>
        </form>
        <div className="auth-switch">
          {mode === 'login' ? 'New to MindsIT?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
            }}
          >
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </div>
        {mode === 'login' && (
          <div className="demo-hint">
            <span>Demo workspace</span>
            <strong>demo@mindsit.com · demo123</strong>
          </div>
        )}
      </section>
      <div className="auth-art">
        <div className="auth-art-ring ring-one"></div>
        <div className="auth-art-ring ring-two"></div>
        <div className="auth-art-core">
          <Sparkles size={28} />
        </div>
        <span className="auth-art-label">
          +8.4%<small>momentum</small>
        </span>
      </div>
    </main>
  )
}
