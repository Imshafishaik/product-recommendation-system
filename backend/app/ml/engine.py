import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def build_product_vectors(products_data):
    """
    products_data: list of dicts with keys: 'id', 'category', 'brand', 'tags', 'description'
    Returns dataframe with computed TF-IDF vectors for products
    """
    if not products_data:
        return None, None
        
    df = pd.DataFrame(products_data)
    
    # Combine text features
    df['combined_features'] = (
        df['category'].fillna('') + ' ' + 
        df['brand'].fillna('') + ' ' + 
        df['tags'].fillna('') + ' ' + 
        df['description'].fillna('')
    )
    
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(df['combined_features'])
    
    return df, tfidf_matrix

def get_recommendations_for_user(user_purchases, all_products_data, top_k=5):
    """
    Content-based filtering using cosine similarity
    """
    df, tfidf_matrix = build_product_vectors(all_products_data)
    if df is None:
        return []
        
    # Get user's purchased product indices
    purchased_product_ids = [p['id'] for p in user_purchases]
    
    if not purchased_product_ids:
        # Cold start: return popular products (mock logic for now: first top_k)
        return df.head(top_k).to_dict(orient='records')
        
    purchased_indices = df[df['id'].isin(purchased_product_ids)].index
    
    # Calculate similarity profile based on purchased items
    user_profile = tfidf_matrix[purchased_indices].mean(axis=0)
    
    # Calculate similarity scores for all products
    import numpy as np
    user_profile = np.asarray(user_profile) # ensure correct type
    cosine_sim = cosine_similarity(user_profile, tfidf_matrix)
    
    # Add scores to dataframe
    df['similarity_score'] = cosine_sim[0]
    
    # Filter out already purchased
    recommended_df = df[~df['id'].isin(purchased_product_ids)]
    
    # Sort and get top K
    top_recommendations = recommended_df.sort_values(by='similarity_score', ascending=False).head(top_k)
    
    results = []
    for _, row in top_recommendations.iterrows():
        results.append({
            "product_id": row['id'],
            "product_ref": row.get('product_ref', ''),
            "title": row.get('title', 'Unknown'),
            "score": row['similarity_score'],
            "reason": f"Similar to products you bought in {row['category']}."
        })
        
    return results

def calculate_rfm(transactions_data):
    """
    Calculate Recency, Frequency, Monetary value
    """
    # Placeholder for full RFM logic
    pass
