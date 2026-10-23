export default function MetricCard({ label, value, change, icon: Icon, tone, detail }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-meta">
        <span className={tone === 'coral' ? 'negative' : 'positive'}>{change}</span>
        <span>{detail}</span>
      </div>
    </article>
  )
}
