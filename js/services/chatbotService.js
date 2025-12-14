import { loadBusinesses } from './businessService.js'
import { getActiveDeals } from './dealsService.js'
import { getFavorites } from './favoritesService.js'
import { getRecommendedBusinesses } from './recommendationService.js'
import { KNOWLEDGE } from './knowledgeBase.js'
import { normalize, extractNumbers, containsAny } from '../utils/stringUtils.js'

const INTENTS = {
  FIND_BY_CATEGORY: ['food', 'restaurant', 'coffee', 'retail', 'book', 'gym', 'fitness', 'shop'],
  FIND_BY_DEAL: ['deal', 'discount', 'coupon', 'offer', 'sale'],
  FIND_BY_RATING: ['best', 'top', 'rated', 'rating', 'stars'],
  FIND_BY_FAVORITES: ['favorite', 'saved', 'bookmark', 'liked'],
  HELP: ['help', 'what can you do', 'support', 'assist'],
  FEATURE_INFO: ['what is', 'how to', 'explain', 'sorting', 'credibility'],
  RECOMMEND: ['recommend', 'suggest', 'what should i', 'for me']
}

export function detectIntent(query) {
  const normalized = normalize(query)

  if (containsAny(normalized, INTENTS.HELP)) return 'HELP'
  if (containsAny(normalized, INTENTS.FEATURE_INFO)) return 'FEATURE_INFO'
  if (containsAny(normalized, INTENTS.RECOMMEND)) return 'RECOMMEND'
  if (containsAny(normalized, INTENTS.FIND_BY_FAVORITES)) return 'FIND_BY_FAVORITES'
  if (containsAny(normalized, INTENTS.FIND_BY_DEAL)) return 'FIND_BY_DEAL'
  if (containsAny(normalized, INTENTS.FIND_BY_RATING)) return 'FIND_BY_RATING'
  if (containsAny(normalized, INTENTS.FIND_BY_CATEGORY)) return 'FIND_BY_CATEGORY'

  return 'UNKNOWN'
}

export function extractEntities(query) {
  const normalized = normalize(query)
  const numbers = extractNumbers(query)
  
  let category = null
  if (containsAny(normalized, ['food', 'restaurant'])) category = 'Food'
  else if (containsAny(normalized, ['coffee'])) category = 'Coffee' // Subcategory mapping if needed, or just map to Food
  else if (containsAny(normalized, ['retail', 'shop', 'store', 'book'])) category = 'Retail'
  else if (containsAny(normalized, ['fitness', 'gym'])) category = 'Fitness'

  // Simple rating extraction: "5 stars", "rating 4"
  let rating = null
  if (numbers.length > 0 && (normalized.includes('star') || normalized.includes('rating') || normalized.includes('rated'))) {
    rating = numbers[0]
  }

  return {
    category,
    rating,
    deal: containsAny(normalized, INTENTS.FIND_BY_DEAL)
  }
}

export async function getBotResponse(intent, entities) {
  const businesses = await loadBusinesses()

  switch (intent) {
    case 'FIND_BY_CATEGORY':
      if (!entities.category) {
        return { text: "I can find businesses by category. Try asking for 'food', 'retail', or 'fitness'." }
      }
      const catMatches = businesses.filter(b => 
        b.category.toLowerCase() === entities.category.toLowerCase() || 
        (b.subcategory && b.subcategory.toLowerCase().includes(entities.category.toLowerCase()))
      )
      if (catMatches.length === 0) return { text: `No businesses found in ${entities.category}.` }
      return { 
        text: `Here are some ${entities.category} businesses:`, 
        data: catMatches 
      }

    case 'FIND_BY_DEAL':
      const deals = getActiveDeals()
      if (deals.length === 0) return { text: "There are no active deals right now." }
      const dealBusinessIds = deals.map(d => String(d.businessId))
      const dealBusinesses = businesses.filter(b => dealBusinessIds.includes(String(b.id)))
      return { 
        text: "Here are businesses with active deals:", 
        data: dealBusinesses 
      }

    case 'FIND_BY_RATING':
      const minRating = entities.rating || 4.5
      const topRated = businesses.filter(b => b.rating >= minRating).sort((a, b) => b.rating - a.rating)
      if (topRated.length === 0) return { text: `No businesses found with rating ${minRating} or higher.` }
      return { 
        text: `Here are the top rated businesses (${minRating}+ stars):`, 
        data: topRated 
      }

    case 'FIND_BY_FAVORITES':
      const favIds = getFavorites().map(String)
      if (favIds.length === 0) return { text: "You haven't saved any favorites yet." }
      const favBusinesses = businesses.filter(b => favIds.includes(String(b.id)))
      return { 
        text: "Here are your favorite businesses:", 
        data: favBusinesses 
      }

    case 'RECOMMEND':
      const recommendations = await getRecommendedBusinesses(3)
      if (recommendations.length === 0) return { text: "I don't have enough data to recommend anything yet. Try browsing or adding favorites!" }
      // recommendations returns objects with { business, score, reasons }
      const recBusinesses = recommendations.map(r => r.business)
      return { 
        text: "Based on your preferences, I recommend:", 
        data: recBusinesses 
      }

    case 'FEATURE_INFO':
      if (containsAny(JSON.stringify(entities), ['credibility'])) return { text: KNOWLEDGE.credibility } // entities doesn't capture keywords well for this, check query in caller or improve extraction? 
      // Actually, let's just check the intent logic or pass query. 
      // For simplicity, let's return a general help or specific if we can infer.
      // Since extractEntities is limited, let's just return a list of topics.
      return { text: "I can explain: Credibility, Sorting, Deals, Reviews, and Recommendations. What would you like to know about?" }

    case 'HELP':
      return { text: "I can help you find businesses, show deals, list your favorites, or explain features. Try asking 'Show me coffee shops' or 'Any deals?'." }

    case 'UNKNOWN':
    default:
      return { text: "I didn't understand that. Try asking about categories, deals, or your favorites." }
  }
}

export async function handleUserQuery(query) {
  const intent = detectIntent(query)
  const entities = extractEntities(query)
  
  // Special handling for FEATURE_INFO to be more specific if possible
  if (intent === 'FEATURE_INFO') {
    const normalized = normalize(query)
    if (normalized.includes('credibility')) return { text: KNOWLEDGE.credibility }
    if (normalized.includes('sort')) return { text: KNOWLEDGE.sorting }
    if (normalized.includes('deal')) return { text: KNOWLEDGE.deals }
    if (normalized.includes('review')) return { text: KNOWLEDGE.reviews }
    if (normalized.includes('recommend')) return { text: KNOWLEDGE.recommendations }
  }

  return await getBotResponse(intent, entities)
}
