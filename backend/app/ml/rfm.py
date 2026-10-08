from datetime import datetime, timedelta
from collections import defaultdict

def compute_rfm_and_segment(customers, transactions, db):
    """
    Computes RFM scores for each customer and assigns a segment:
      - Champions:   High R, High F, High M
      - Loyal:       High F, High M
      - At-Risk:     Low R, previously High F/M
      - New:         Low R, Low F
      - Active:      Mid-range all
    """
    now = datetime.utcnow()
    
    # Build per-customer transaction stats
    stats = defaultdict(lambda: {"dates": [], "count": 0, "total": 0.0})
    
    # We need product prices — load from DB
    from . import models
    product_prices = {}
    
    for tx in transactions:
        cid = tx.customer_id
        stats[cid]["dates"].append(tx.timestamp)
        stats[cid]["count"] += tx.quantity
        # Approximate monetary: use quantity (price info might not always exist here)
        stats[cid]["total"] += tx.quantity
    
    # Compute raw scores per customer
    customer_scores = {}
    for cid, data in stats.items():
        if not data["dates"]:
            continue
        last_purchase = max(data["dates"])
        recency_days = (now - last_purchase).days
        frequency = data["count"]
        monetary = data["total"]
        
        customer_scores[cid] = {
            "recency": recency_days,
            "frequency": frequency,
            "monetary": monetary
        }
    
    if not customer_scores:
        return 0
    
    # Normalize to 1-5 buckets using percentiles
    all_recency = [v["recency"] for v in customer_scores.values()]
    all_freq = [v["frequency"] for v in customer_scores.values()]
    all_monetary = [v["monetary"] for v in customer_scores.values()]
    
    def bucket(value, values, reverse=False):
        sorted_vals = sorted(values, reverse=reverse)
        n = len(sorted_vals)
        percentile = sorted_vals.index(value) / n
        if percentile < 0.2: return 5
        if percentile < 0.4: return 4
        if percentile < 0.6: return 3
        if percentile < 0.8: return 2
        return 1
    
    # Assign segments
    def assign_segment(r_score, f_score, m_score):
        rfm = r_score + f_score + m_score
        if r_score >= 4 and f_score >= 4 and m_score >= 4:
            return "Champions"
        elif f_score >= 4 and m_score >= 4:
            return "Loyal"
        elif r_score <= 2 and f_score >= 3:
            return "At-Risk"
        elif r_score >= 4 and f_score <= 2:
            return "New"
        else:
            return "Active"
    
    updated = 0
    for customer in customers:
        if customer.id not in customer_scores:
            continue
        
        s = customer_scores[customer.id]
        # Recency: lower days = better, so reverse=False (lower index = higher score)
        r = bucket(s["recency"], all_recency, reverse=False)
        f = bucket(s["frequency"], all_freq, reverse=True)
        m = bucket(s["monetary"], all_monetary, reverse=True)
        
        segment = assign_segment(r, f, m)
        
        if customer.segment != segment:
            customer.segment = segment
            updated += 1
    
    db.commit()
    return updated
