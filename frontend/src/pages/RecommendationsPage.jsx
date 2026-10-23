import { ArrowUpRight, RefreshCw, Sparkles } from 'lucide-react'
import { PageHeader } from '../components'

export default function RecommendationsPage({
  recommendations,
  confidence,
  generatingBatch,
  onGenerateBatch,
  onViewAudience,
}) {
  return (
    <section className="page-view">
      <PageHeader
        eyebrow="RECOMMENDATION STUDIO"
        title="Personalized recommendations"
        description="Review the next-best products and rewards generated from customer behavior."
        action={
          <button
            className="primary-button"
            disabled={generatingBatch}
            onClick={onGenerateBatch}
          >
            {generatingBatch ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} />}
            {generatingBatch ? 'Retraining model...' : 'Generate batch'}
          </button>
        }
      />
      <div className="recommendation-hero">
        <div>
          <span className="eyebrow light">MODEL PERFORMANCE</span>
          <h3>Item-to-item affinity is performing well.</h3>
          <p>Collaborative filtering is trained directly on purchase history in PostgreSQL loyum_db.</p>
        </div>
        <div className="model-score">
          <strong>{confidence}</strong>
          <span>confidence</span>
        </div>
      </div>
      <div className="recommendation-page-grid">
        {recommendations.map(
          ({
            title,
            category,
            uplift,
            reason,
            color,
            icon: Icon,
            audience_segment,
            audience_count,
          }) => (
            <article className="large-recommendation" key={title}>
              <div className={`recommendation-icon ${color}`}>
                <Icon size={20} />
              </div>
              <span className="product-category">{category}</span>
              <h3>{title}</h3>
              <p>{reason}</p>
              <div className="recommendation-footer">
                <span>Predicted uplift</span>
                <strong>{uplift}</strong>
              </div>
              <button
                className="outline-button"
                onClick={() => onViewAudience(audience_segment)}
              >
                View audience ({audience_count ? `${audience_count} ${audience_segment}` : audience_segment}){' '}
                <ArrowUpRight size={14} />
              </button>
            </article>
          ),
        )}
      </div>
    </section>
  )
}
