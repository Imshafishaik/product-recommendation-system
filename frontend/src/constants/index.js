import { PackageOpen, Sparkles, TrendingUp } from 'lucide-react'

export const initialCustomers = [
  { id: 'cus_001', name: 'Sophie Martin', initials: 'SM', email: 'sophie.martin@email.com', segment: 'Loyal', score: 92, spend: '$1,284', orders: 28, lastSeen: '2 days ago', tone: 'green' },
  { id: 'cus_002', name: 'Lucas Bernard', initials: 'LB', email: 'lucas.bernard@email.com', segment: 'At risk', score: 48, spend: '$736', orders: 14, lastSeen: '19 days ago', tone: 'orange' },
  { id: 'cus_003', name: 'Emma Dubois', initials: 'ED', email: 'emma.dubois@email.com', segment: 'Loyal', score: 88, spend: '$2,104', orders: 34, lastSeen: '4 days ago', tone: 'green' },
  { id: 'cus_004', name: 'Thomas Petit', initials: 'TP', email: 'thomas.petit@email.com', segment: 'Inactive', score: 21, spend: '$214', orders: 5, lastSeen: '58 days ago', tone: 'red' },
  { id: 'cus_005', name: 'Camille Leroy', initials: 'CL', email: 'camille.leroy@email.com', segment: 'New', score: 64, spend: '$408', orders: 8, lastSeen: '6 days ago', tone: 'blue' },
]

export const initialRecommendations = [
  { id: 'rec_01', title: 'Weekend discovery bundle', category: 'Lifestyle', uplift: '+24%', reason: 'Pairs well with recent purchases across lifestyle & home categories', audience_segment: 'Growing', color: 'blue', icon: PackageOpen },
  { id: 'rec_02', title: 'Early access: Spring edit', category: 'Fashion', uplift: '+18%', reason: 'Popular with loyal customers who purchased outerwear in the last 30 days', audience_segment: 'Loyal', color: 'coral', icon: Sparkles },
  { id: 'rec_03', title: 'Double points on essentials', category: 'Rewards', uplift: '+14%', reason: 'Reactivates at-risk shoppers with high repeat propensity', audience_segment: 'At risk', color: 'yellow', icon: TrendingUp },
  { id: 'rec_04', title: 'Linen weekend tote companion', category: 'Accessories', uplift: '+16%', reason: 'High basket co-occurrence with spring edit and discovery bundles', audience_segment: 'New', color: 'green', icon: PackageOpen },
]

export const shopperProducts = [
  { id: 'prod_bundle_01', name: 'Weekend discovery bundle', category: 'Lifestyle', price: 64, reason: 'Complements your recent purchases' },
  { id: 'prod_reward_04', name: 'Double points on essentials', category: 'Rewards', price: 42.5, reason: 'Popular with your customer segment' },
  { id: 'prod_spring_02', name: 'Spring edit overshirt', category: 'Fashion', price: 89, reason: 'Frequently bought with your saved items' },
  { id: 'prod_home_07', name: 'Linen weekend tote', category: 'Accessories', price: 36, reason: 'A lightweight match for your basket' },
]

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const AUTH_TOKEN_KEY = 'mindsit_access_token'

export function authHeaders(json = false) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export function customerTone(segment) {
  return { Loyal: 'green', 'At risk': 'orange', Inactive: 'red', New: 'blue', Growing: 'blue' }[segment] || 'blue'
}

export function currentIsoTime() {
  return new Date().toISOString()
}
