import { loadBusinesses } from './businessService.js'
import { getFavorites } from './favoritesService.js'
import { getUserReviews } from './reviewService.js'
import { getActiveDeals } from './dealsService.js'
import { calculateCredibility } from './credibilityService.js'
import { getHistory, getMostViewedCategories } from './historyService.js'

const WEIGHTS = {
  CATEGORY_MATCH: 20,
  RATING_MULTIPLIER: 3,
  CREDIBILITY_MULTIPLIER: 1.5,
  ACTIVE_DEAL: 10,
  HISTORY_MATCH: 15
}

export async function getUserPreferences() {
  const businesses = await loadBusinesses()
  const favorites = getFavorites()
  const userReviews = getUserReviews()
  const historyCategories = getMostViewedCategories(businesses)

  const preferredCategories = new Set()

  // Add categories from favorites
  favorites.forEach(favId => {
    const b = businesses.find(biz => String(biz.id) === String(favId))
    if (b) preferredCategories.add(b.category)
  })

  // Add categories from reviews
  userReviews.forEach(review => {
    const b = businesses.find(biz => String(biz.id) === String(review.businessId))
    if (b) preferredCategories.add(b.category)
  })

  // Add top 3 categories from history
  historyCategories.slice(0, 3).forEach(cat => preferredCategories.add(cat))

  return {
    preferredCategories: Array.from(preferredCategories),
    favorites: new Set(favorites.map(String)),
    historyCategories: new Set(historyCategories.slice(0, 3)) // Top 3 viewed
  }
}

export async function scoreBusiness(business, preferences, reviewsForBusiness) {
  let score = 0
  const reasons = []

  // A. Category Match
  if (preferences.preferredCategories.includes(business.category)) {
    score += WEIGHTS.CATEGORY_MATCH
    reasons.push(`Matches your interest in ${business.category}`)
  }

  // B. Rating Weight
  const ratingScore = (business.rating || 0) * WEIGHTS.RATING_MULTIPLIER
  score += ratingScore
  if (business.rating >= 4.5) {
    reasons.push('Highly rated by community')
  }

  // C. Credibility Weight
  // Calculate average credibility of reviews for this business
  let avgCredibility = 0
  if (reviewsForBusiness && reviewsForBusiness.length > 0) {
    const totalCred = reviewsForBusiness.reduce((sum, r) => sum + calculateCredibility(r), 0)
    avgCredibility = totalCred / reviewsForBusiness.length
  }
  score += avgCredibility * WEIGHTS.CREDIBILITY_MULTIPLIER
  if (avgCredibility > 5) { // Arbitrary threshold for "high credibility"
    reasons.push('High credibility score')
  }

  // D. Deal Weight
  const activeDeals = getActiveDeals()
  const hasDeal = activeDeals.some(d => String(d.businessId) === String(business.id))
  if (hasDeal) {
    score += WEIGHTS.ACTIVE_DEAL
    reasons.push('Has active deal')
  }

  // E. History Weight
  if (preferences.historyCategories.has(business.category)) {
    score += WEIGHTS.HISTORY_MATCH
    // Avoid duplicate reason if category match already added
    if (!reasons.some(r => r.includes(`interest in ${business.category}`))) {
      reasons.push('Based on your browsing history')
    }
  }

  return { score, reasons }
}

export async function getRecommendedBusinesses(limit = 5) {
  const businesses = await loadBusinesses()
  const preferences = await getUserPreferences()
  
  // We need reviews to calculate credibility per business
  // Importing loadReviews from reviewService might be circular or heavy, 
  // but we need it. Let's assume we can get all reviews.
  // To avoid circular dependency issues if any, we'll dynamically import or assume reviewService is safe.
  // Actually, reviewService depends on nothing that depends on recommendationService.
  const { loadReviews } = await import('./reviewService.js')
  const allReviews = await loadReviews()

  const scored = []

  for (const business of businesses) {
    // Exclude if already favorited
    if (preferences.favorites.has(String(business.id))) {
      continue
    }

    const businessReviews = allReviews.filter(r => String(r.businessId) === String(business.id))
    const { score, reasons } = await scoreBusiness(business, preferences, businessReviews)
    
    scored.push({ business, score, reasons })
  }

  // Sort by score DESC
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, limit)
}
