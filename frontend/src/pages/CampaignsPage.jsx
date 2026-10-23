import { ArrowUpRight, Send } from 'lucide-react'
import { PageHeader } from '../components'

export default function CampaignsPage({
  metrics,
  campaigns,
  sentCampaign,
  onOpenCreate,
  onQueueAtRisk,
}) {
  const displayCampaigns =
    campaigns.length > 0
      ? campaigns
      : [
          {
            campaign_id: 'cmp_1001',
            name: 'Spring loyalty preview',
            segment: 'Loyal',
            status: 'sent',
            lift_rate: '25%',
            created_at: '2 days ago',
          },
          {
            campaign_id: 'cmp_1002',
            name: 'Welcome reward',
            segment: 'New',
            status: 'sent',
            lift_rate: '18%',
            created_at: '9 days ago',
          },
          {
            campaign_id: 'cmp_1003',
            name: 'At-risk winback',
            segment: 'At risk',
            status: 'draft',
            lift_rate: 'Ready',
            created_at: '32 recipients',
          },
        ]

  return (
    <section className="page-view">
      <PageHeader
        eyebrow="RETENTION AUTOMATION"
        title="Campaigns"
        description="Turn declining engagement signals into timely, targeted customer actions."
        action={
          <button className="primary-button" onClick={onOpenCreate}>
            <Send size={15} /> Create campaign
          </button>
        }
      />
      <div className="campaign-grid">
        <article className="campaign-feature">
          <div className="campaign-feature-top">
            <span className="segment-pill orange">Needs attention</span>
            <span className="eyebrow">RFM TRIGGER</span>
          </div>
          <h3>Bring back customers losing momentum</h3>
          <p>
            {metrics.atRiskCustomers} customers have not returned within their expected purchase
            interval. A personalized reward can bring them back.
          </p>
          <div className="campaign-metrics">
            <div>
              <strong>{metrics.atRiskCustomers}</strong>
              <span>recipients</span>
            </div>
            <div>
              <strong>+18%</strong>
              <span>expected lift</span>
            </div>
            <div>
              <strong>Today</strong>
              <span>recommended send</span>
            </div>
          </div>
          <button className="primary-button" onClick={onQueueAtRisk}>
            {sentCampaign ? 'Campaign queued' : 'Review & queue campaign'}{' '}
            <ArrowUpRight size={15} />
          </button>
        </article>
        <div className="campaign-list">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h2>Campaign history</h2>
            </div>
            <button className="text-button" onClick={onOpenCreate}>
              + New
            </button>
          </div>
          {displayCampaigns.map((camp) => (
            <div className="campaign-row" key={camp.campaign_id}>
              <div
                className={`campaign-status ${camp.status === 'draft' ? 'draft' : ''}`}
              ></div>
              <div>
                <strong>{camp.name}</strong>
                <span>
                  {camp.status === 'draft'
                    ? `Draft · ${camp.estimated_recipients || 32} recipients`
                    : `${camp.segment} segment · ${camp.estimated_recipients || 45} sent`}
                </span>
              </div>
              <span className="campaign-rate">{camp.lift_rate || 'Ready'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
