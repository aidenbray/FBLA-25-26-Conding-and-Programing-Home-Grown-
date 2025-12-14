/**
 * Review Service Module
 * 
 * Manages user-generated reviews with advanced data merging and normalization.
 * Implements a robust data layer supporting CRUD operations, visibility control, and caching.
 * 
 * Key Features:
 * - Hybrid data model (base JSON + localStorage customizations)
 * - Data normalization for consistent structure
 * - Review visibility management (hide/unhide for moderation)
 * - Soft delete pattern (preserves data history)
 * - Client-side caching for performance
 * - Like and comment functionality
 * 
 * Data Architecture:
 * - Base Data: Original reviews.json (immutable)
 * - Custom Reviews: User-created reviews in localStorage
 * - Deleted IDs: Soft-deleted reviews (not shown but preserved)
 * - Hidden IDs: Admin-hidden reviews (moderation)
 * 
 * Review Object Structure:
 * {
 *   id: number,           // Unique identifier (timestamp)
 *   businessId: number,   // Foreign key to business
 *   text: string,         // Review content
 *   rating: number,       // 1-5 stars
 *   likes: number,        // Community endorsements
 *   comments: Array,      // User comments
 *   image: string,        // Optional review photo
 *   date: string          // ISO timestamp
 * }
 * 
 * Performance Optimizations:
 * - Caches original reviews to avoid repeated fetches
 * - Normalizes data once per load
 * - Batch operations where possible
 * 
 * @module services/reviewService
 */

const REVIEW_PATH = '/data/reviews.json'

/**
 * Cache for original reviews from base data file
 * Prevents repeated network requests within same session
 * @type {Array<Object>|null}
 * @private
 */
let originalReviewsCache = null

/**
 * Normalize Review Object
 * 
 * Ensures all review objects have consistent structure with default values.
 * Prevents undefined/null errors from missing or malformed data.
 * 
 * Normalization Rules:
 * - likes: Coerce to number, default 0 (handles string "0" or missing)
 * - comments: Ensure array, default [] (handles number or missing)
 * - image: Provide default placeholder if missing
 * - All other fields: Pass through as-is
 * 
 * Why Normalization Matters:
 * - Prevents runtime errors from unexpected data types
 * - Simplifies rendering logic (no null checks needed)
 * - Handles legacy data with missing fields
 * - Supports gradual schema evolution
 * 
 * @function
 * @private
 * @param {Object} review - Raw review object
 * @returns {Object} Normalized review object with guaranteed structure
 */
function normalizeReview(review) {
  return {
    ...review,
    likes: Number(review.likes) || 0,
    comments: Array.isArray(review.comments) ? review.comments : [],
    image: review.image || 'review-placeholder.svg'
  }
}

async function ensureOriginalReviews() {
  if (originalReviewsCache) {
    return originalReviewsCache
  }
  try {
    // Add timestamp to prevent caching of old corrupted data
    const res = await fetch(`${REVIEW_PATH}?v=${Date.now()}`)
    if (res.ok) {
      const json = await res.json()
      originalReviewsCache = json.map(normalizeReview)
    } else {
      originalReviewsCache = []
    }
  } catch (e) {
    console.warn('Unable to load reviews', e)
    originalReviewsCache = []
  }
  return originalReviewsCache
}

function getCustomReviews() {
  const stored = JSON.parse(localStorage.getItem('reviews_custom') || '[]')
  return stored.map(normalizeReview)
}

function persistCustomReviews(customReviews) {
  localStorage.setItem('reviews_custom', JSON.stringify(customReviews))
}

function upsertCustomReview(review) {
  const custom = getCustomReviews()
  const index = custom.findIndex(r => r.id === review.id)
  const normalized = normalizeReview(review)
  if (index >= 0) {
    custom[index] = normalized
  } else {
    custom.push(normalized)
  }
  persistCustomReviews(custom)
  return normalized
}

export async function mergeReviews() {
  const original = await ensureOriginalReviews()
  const custom = getCustomReviews()
  const deletedIds = JSON.parse(localStorage.getItem('reviews_deleted_ids') || '[]')
  
  const customById = new Map(custom.map(review => [review.id, review]))

  let merged = original.map(review => customById.get(review.id) || review)
  const additional = custom.filter(review => !original.some(orig => orig.id === review.id))
  
  merged = [...merged, ...additional]
  
  return merged.filter(r => !deletedIds.includes(r.id))
}

export async function loadReviews() {
  const reviews = await mergeReviews()
  const hiddenIds = JSON.parse(localStorage.getItem('reviews_hidden') || '[]')
  return reviews.filter(r => !hiddenIds.includes(r.id))
}

export async function getReviewsForBusiness(businessId) {
  const reviews = await mergeReviews()
  return reviews.filter(review => String(review.businessId) === String(businessId))
}

export async function addReview(businessId, reviewObj) {
  const newReview = {
    id: Date.now(),
    businessId,
    text: reviewObj.text,
    rating: reviewObj.rating,
    likes: 0,
    comments: [],
    image: reviewObj.image || 'review-placeholder.svg',
    date: new Date().toISOString()
  }
  return upsertCustomReview(newReview)
}

export async function likeReview(reviewId) {
  const reviews = await mergeReviews()
  const review = reviews.find(r => String(r.id) === String(reviewId))
  if (!review) {
    throw new Error('Review not found')
  }
  const updated = { ...review, likes: (Number(review.likes) || 0) + 1 }
  return upsertCustomReview(updated)
}

export async function commentOnReview(reviewId, commentText) {
  const reviews = await mergeReviews()
  const review = reviews.find(r => String(r.id) === String(reviewId))
  if (!review) {
    throw new Error('Review not found')
  }
  const updated = {
    ...review,
    comments: [...(Array.isArray(review.comments) ? review.comments : []), commentText]
  }
  return upsertCustomReview(updated)
}

export function getUserReviews() {
  return getCustomReviews()
}
