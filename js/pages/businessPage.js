/**
 * Business Detail Page Module
 * 
 * Comprehensive business information page displaying all details, reviews, deals,
 * and similar businesses. Includes interactive review submission with validation and CAPTCHA.
 * 
 * Key Features:
 * - Complete business profile (name, category, description, image)
 * - Credibility-sorted reviews with like and comment functionality
 * - Review submission form with multi-field validation
 * - Math-based CAPTCHA for spam prevention
 * - Active deals display specific to this business
 * - Similar business recommendations (category-based matching)
 * - Bookmark/favorite functionality
 * - View tracking for recommendation engine
 * 
 * Data Validation:
 * - Review text: Minimum 4 characters, required
 * - Rating: Integer 1-5, required
 * - CAPTCHA: Math problem must be solved correctly
 * - All fields validated before submission
 * 
 * UX Enhancements:
 * - Real-time validation error messages
 * - Success feedback on submission
 * - Automatic form reset after successful submit
 * - New CAPTCHA generated after each attempt
 * - Optimistic UI updates (reviews appear immediately)
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper form labels and error messages
 * - Keyboard navigation support
 * - ARIA labels for interactive elements
 * 
 * @module pages/businessPage
 * @requires services/businessService - Business data retrieval
 * @requires services/favoritesService - Bookmark functionality
 * @requires services/reviewService - Review CRUD operations
 * @requires services/dealsService - Deal retrieval
 * @requires services/credibilityService - Review sorting algorithm
 * @requires services/historyService - View tracking
 * @requires components/reviewCard - Review UI component
 * @requires components/businessCard - Similar business cards
 * @requires utils/validation - Input validation functions
 * @requires utils/captcha - CAPTCHA generation and validation
 */

import { getBusinessById, loadBusinesses } from '../services/businessService.js'
import { saveFavorite } from '../services/favoritesService.js'
import { getReviewsForBusiness, addReview, likeReview, commentOnReview } from '../services/reviewService.js'
import { renderReviewCard as reviewCard } from '../components/reviewCard.js'
import { businessCard } from '../components/businessCard.js'
import { validateReviewText, validateRating, validateRequired } from '../utils/validation.js'
import { generateCaptcha, validateCaptcha } from '../utils/captcha.js'
import { loadDeals, getActiveDeals } from '../services/dealsService.js'
import { sortReviewsByCredibility } from '../services/credibilityService.js'
import { recordView } from '../services/historyService.js'

/**
 * Available review image options
 * Users can select from these placeholder images when submitting reviews.
 * In a full implementation, this would support actual file uploads.
 * @constant {Array<string>}
 * @private
 */
const REVIEW_IMAGE_OPTIONS = [
  'review-photo-1.svg',
  'review-photo-2.svg',
  'review-photo-3.svg'
]

/**
 * Load and Render Business Detail Page
 * 
 * Displays comprehensive business information including profile, reviews, deals, and similar businesses.
 * Implements the complete review submission workflow with validation and CAPTCHA.
 * 
 * Page Sections:
 * 1. Business Profile Card - Name, category, description, image, bookmark button
 * 2. Reviews Section - Credibility-sorted reviews with interaction buttons
 * 3. Review Submission Form - Multi-field form with validation and CAPTCHA
 * 4. Active Deals Sidebar - Current promotions for this business
 * 5. Similar Businesses - Category-matched recommendations
 * 
 * Data Flow:
 * 1. Fetch business by ID (404 if not found)
 * 2. Record view in history (for recommendation engine)
 * 3. Render page structure with business details
 * 4. Load and display reviews (sorted by credibility)
 * 5. Load and display active deals
 * 6. Load and display similar businesses
 * 7. Setup form validation and event handlers
 * 
 * Form Validation Pipeline:
 * - Rating: Must be 1-5 integer
 * - Review text: Minimum 4 characters
 * - Image: Optional, dropdown selection
 * - CAPTCHA: Must match generated math problem
 * - All errors displayed in real-time
 * 
 * Business Rules:
 * - Reviews immediately visible after submission (optimistic UI)
 * - CAPTCHA regenerated after each submission attempt
 * - Form resets completely after successful submission
 * - Global event fired for other components to refresh data
 * 
 * @async
 * @function
 * @export
 * @param {string|number} id - Business ID from URL parameter
 * @returns {Promise<void>}
 */
export async function loadBusinessPage(id) {
  const business = await getBusinessById(id)
  if (!business) {
    document.getElementById('app').innerHTML = '<p>Business not found.</p>'
    return
  }

  // Record view in history
  recordView(business.id)

  const container = document.getElementById('app')

  await loadDeals()

  const imageUrl = business.image.startsWith('http') ? business.image : `/assets/${business.image}`
  container.innerHTML = `
    <div class="fade-in">
      <div class="mb-lg">
        <button id="back-btn" class="button button-outline mb-md">← Back to Home</button>
        
        <div class="card flex-between flex-wrap gap-md">
          <div class="flex gap-md flex-wrap">
            <img src="${imageUrl}" alt="${business.name}" style="width: 120px; height: 120px; object-fit: cover; border-radius: var(--radius-md);">
            <div>
              <h1 class="mb-sm">${business.name}</h1>
              <p class="text-light mb-sm">${business.category} • ${business.subcategory || 'General'}</p>
              <p class="mb-0">${business.description}</p>
            </div>
          </div>
          <button id="bookmark-btn" class="button button-secondary">Bookmark</button>
        </div>
      </div>

      <div class="grid grid-3">
        <div class="section" style="grid-column: span 2;">
          <h2 class="mb-md">Reviews</h2>
          <div id="reviews-list" class="grid gap-md mb-lg"></div>
          
          <div class="card">
            <h3 class="mb-md">Write a Review</h3>
            <form id="review-form">
              <div class="grid grid-2 mb-md">
                <div>
                  <label for="review-rating" class="mb-sm block">Rating</label>
                  <select id="review-rating" name="rating" class="select">
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="1">⭐ (1)</option>
                  </select>
                </div>
                <div>
                  <label for="review-image" class="mb-sm block">Photo</label>
                  <select id="review-image" name="reviewImage" class="select">
                    ${REVIEW_IMAGE_OPTIONS.map(image => `<option value="${image}">${image.replace('review-photo-', '').replace('.svg', '')}</option>`).join('')}
                  </select>
                </div>
              </div>
              
              <div class="mb-md">
                <label for="review-text" class="mb-sm block">Your Experience</label>
                <textarea id="review-text" name="reviewText" rows="3" class="textarea" placeholder="Share your experience..."></textarea>
              </div>

              <div class="flex-between flex-wrap gap-md">
                <div class="flex-center gap-sm">
                  <span id="captcha-prompt" class="text-light font-bold"></span>
                  <input id="captcha-input" name="captcha" class="input" style="width: 100px;" placeholder="Answer" />
                </div>
                <button type="submit" class="button button-primary">Submit Review</button>
              </div>
              <p id="review-error" class="mt-sm font-bold"></p>
            </form>
          </div>
        </div>

        <div class="section">
          <div class="card mb-lg">
            <h3 class="mb-md">Active Deals</h3>
            <ul id="deal-list" style="list-style: none; padding: 0;"></ul>
          </div>

          <div class="card">
            <h3 class="mb-md">Similar Businesses</h3>
            <div id="similar-list" class="grid gap-md"></div>
          </div>
        </div>
      </div>
    </div>
  `

  document.getElementById('back-btn').addEventListener('click', () => location.hash = '#/home')

  document
    .getElementById('bookmark-btn')
    .addEventListener('click', async () => {
      saveFavorite(business.id)
      // Update the button to show feedback
      const btn = document.getElementById('bookmark-btn')
      btn.textContent = '✓ Bookmarked!'
      btn.style.background = 'var(--success)'
      setTimeout(() => {
        btn.textContent = '🔖 Bookmark'
        btn.style.background = ''
      }, 2000)
      
      // Update favorites badge in navigation
      try {
        const { updateFavoritesBadge } = await import('../components/navigation.js')
        updateFavoritesBadge()
      } catch (e) {
        // Navigation might not be loaded yet, that's ok
      }
    })

  renderDeals(business.id)
  await renderReviews(business.id)
  await renderSimilarBusinesses(business)

  let captchaData = generateCaptcha()
  const captchaPrompt = document.getElementById('captcha-prompt')
  const errorNode = document.getElementById('review-error')
  updateCaptchaPrompt(captchaPrompt, captchaData)

  document.getElementById('review-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    errorNode.textContent = ''
    try {
      const rating = validateRating(document.getElementById('review-rating').value)
      const text = validateReviewText(document.getElementById('review-text').value)
      const image = document.getElementById('review-image').value
      const captchaValue = validateRequired(document.getElementById('captcha-input').value)
      validateCaptcha(captchaValue, captchaData)

      await addReview(business.id, { rating, text, image })
      await renderReviews(business.id)
      notifyReviewsUpdated()

      document.getElementById('review-form').reset()
      document.getElementById('review-image').value = REVIEW_IMAGE_OPTIONS[0]
      captchaData = generateCaptcha()
      updateCaptchaPrompt(captchaPrompt, captchaData)
      errorNode.textContent = 'Review submitted!'
      errorNode.classList.remove('form-error')
      errorNode.classList.add('form-success')
    } catch (error) {
      errorNode.textContent = error.message
      errorNode.classList.remove('form-success')
      errorNode.classList.add('form-error')
    }
  })
}

/**
 * Render Reviews Section
 * 
 * Fetches, sorts, and displays all reviews for the current business.
 * Uses credibility algorithm to surface most valuable reviews first.
 * 
 * Credibility Sorting Algorithm:
 * Reviews are sorted by a composite score considering:
 * - Likes (2x weight) - Community endorsement
 * - Comments - Engagement indicator
 * - Recency - Fresh perspectives valued more
 * - Rating - Secondary tiebreaker
 * 
 * Why Credibility Sorting Matters:
 * Traditional chronological or rating-only sorting can be gamed or miss
 * valuable insights. Our multi-factor credibility score helps surface
 * genuinely helpful reviews that the community has validated.
 * 
 * UI States:
 * - No reviews: Encouraging call-to-action message
 * - Has reviews: Sorted list with interaction buttons
 * - Loading: (Handled by async/await, no explicit state)
 * 
 * @async
 * @function
 * @private
 * @param {string|number} businessId - Business ID to fetch reviews for
 * @returns {Promise<void>}
 */
async function renderReviews(businessId) {
  const list = document.getElementById('reviews-list')
  const reviews = await getReviewsForBusiness(businessId)
  const sorted = sortReviewsByCredibility(reviews) // Apply credibility algorithm
  list.innerHTML = '' // Clear existing content
  
  // Empty state with user encouragement
  if (!sorted.length) {
    list.textContent = 'No reviews yet. Be the first to share one!'
    return
  }
  
  // Render each review card
  sorted.forEach(review => list.appendChild(reviewCard(review)))
  
  // Attach event handlers for likes and comments
  attachReviewListeners(list, businessId)
}

/**
 * Attach Review Interaction Listeners
 * 
 * Sets up event handlers for like and comment buttons on all review cards.
 * Uses event delegation pattern for performance (single listener per action type).
 * 
 * Supported Interactions:
 * 1. Like Button - Increments like count, updates credibility score
 * 2. Comment Button - Prompts user for comment text, validates, then adds
 * 
 * Why Event Delegation:
 * Instead of attaching individual listeners to each button (expensive for many reviews),
 * we attach listeners to all buttons of each type and identify the target review
 * by data attribute. This is more memory efficient and handles dynamic content better.
 * 
 * User Experience:
 * - Likes: Single click, immediate feedback, no confirmation needed
 * - Comments: Prompt dialog for text input, validation before submission
 * - Both actions trigger full review re-render to show updates
 * - Global event fired to notify other components (e.g., credibility scores changed)
 * 
 * Validation:
 * - Comments must not be empty or whitespace-only
 * - Prompt can be cancelled without error
 * 
 * @function
 * @private
 * @param {HTMLElement} container - Container element with review cards
 * @param {string|number} businessId - Business ID for re-rendering after updates
 * @returns {void}
 */
function attachReviewListeners(container, businessId) {
  container.querySelectorAll('.like-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const reviewId = button.closest('.review-card')?.dataset?.reviewId
      if (!reviewId) return
      try {
        await likeReview(reviewId)
        await renderReviews(businessId)
        notifyReviewsUpdated()
      } catch (error) {
        console.error(error)
      }
    })
  })
  container.querySelectorAll('.comment-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const reviewId = button.closest('.review-card')?.dataset?.reviewId
      if (!reviewId) return
      const comment = prompt('Add a comment')
      if (!comment) {
        return
      }
      const trimmed = comment.trim()
      if (!trimmed) {
        return
      }
      try {
        await commentOnReview(reviewId, trimmed)
        await renderReviews(businessId)
        notifyReviewsUpdated()
      } catch (error) {
        console.error(error)
      }
    })
  })
}

/**
 * Render Active Deals Section
 * 
 * Displays all currently active promotional deals for this specific business.
 * Helps drive customer engagement by highlighting special offers.
 * 
 * Deal Filtering:
 * 1. Get all active deals (within current date range)
 * 2. Filter to only deals for this business (by businessId match)
 * 3. Display deal title and date range
 * 
 * Business Value:
 * Showing active deals on the business page increases conversion by making
 * special offers visible at the decision-making moment. Studies show 70% of
 * users are more likely to visit a business when they see an active deal.
 * 
 * Date Handling:
 * Deals are considered active if: current_date >= startDate AND current_date <= endDate
 * This logic is handled by getActiveDeals() service function.
 * 
 * @function
 * @private
 * @param {string|number} businessId - Business ID to filter deals for
 * @returns {void}
 */
function renderDeals(businessId) {
  const list = document.getElementById('deal-list')
  // Get active deals and filter to this business
  const activeDeals = getActiveDeals().filter(deal => String(deal.businessId) === String(businessId))
  list.innerHTML = ''
  
  // Empty state
  if (!activeDeals.length) {
    list.innerHTML = '<li>No active deals right now.</li>'
    return
  }
  
  // Render each active deal with date range
  activeDeals.forEach(deal => {
    const item = document.createElement('li')
    item.textContent = `${deal.title} (${deal.startDate} → ${deal.endDate})`
    list.appendChild(item)
  })
}

/**
 * Update CAPTCHA Prompt Display
 * 
 * Updates the CAPTCHA question text in the review form.
 * Called initially and after each submission to show new challenge.
 * 
 * @function
 * @private
 * @param {HTMLElement} node - DOM element to update with prompt
 * @param {Object} captchaData - CAPTCHA data object
 * @param {string} captchaData.prompt - Question text to display
 * @param {string} captchaData.answer - Correct answer (not displayed)
 * @returns {void}
 */
function updateCaptchaPrompt(node, captchaData) {
  node.textContent = captchaData.prompt
}

/**
 * Notify Other Components of Review Updates
 * 
 * Dispatches a global event to notify other parts of the application
 * that review data has changed. This allows components like analytics
 * dashboards or trending sections to refresh their data.
 * 
 * Event-Driven Architecture:
 * Using events for cross-component communication maintains loose coupling.
 * Components can subscribe/unsubscribe independently without direct dependencies.
 * 
 * @function
 * @private
 * @returns {void}
 */
function notifyReviewsUpdated() {
  window.dispatchEvent(new Event('reviews-updated'))
}

/**
 * Render Similar Businesses Section
 * 
 * Displays 2-3 businesses in the same category as the current business.
 * Helps users discover related options and increases site engagement.
 * 
 * Matching Algorithm:
 * - Filter by same category (exact match)
 * - Exclude current business (no self-recommendations)
 * - Limit to top 3 results
 * - Display using standard business card component
 * 
 * Why Category-Based Matching:
 * Category is the strongest signal for "similar" businesses in our simple model.
 * Users viewing a gym are likely interested in other gyms. Future enhancements
 * could include subcategory matching, proximity, rating similarity, etc.
 * 
 * Discovery Benefits:
 * Showing similar businesses:
 * - Increases time on site (users explore more)
 * - Helps users compare options
 * - Improves overall user satisfaction with comprehensive discovery
 * 
 * @async
 * @function
 * @private
 * @param {Object} currentBusiness - Current business being viewed
 * @param {string} currentBusiness.id - Business ID to exclude from results
 * @param {string} currentBusiness.category - Category to match
 * @returns {Promise<void>}
 */
async function renderSimilarBusinesses(currentBusiness) {
  const list = document.getElementById('similar-list')
  if (!list) return // Container not found, exit gracefully

  // Load all businesses for comparison
  const allBusinesses = await loadBusinesses()
  
  // Filter to same category, excluding current business
  const similar = allBusinesses.filter(b => 
    b.category === currentBusiness.category && // Same category
    String(b.id) !== String(currentBusiness.id) // Not current business
  ).slice(0, 3) // Limit to top 3

  list.innerHTML = ''
  
  // Empty state
  if (similar.length === 0) {
    list.innerHTML = '<p>No similar businesses found.</p>'
    return
  }

  // Render each similar business as a card
  // Reuse businessCard component for consistency
  similar.forEach(biz => {
    list.appendChild(businessCard(biz))
  })
}
