/**
 * Business Card Component
 * 
 * Creates an interactive card UI element for displaying business information.
 * Used throughout the application for business listings and search results.
 * 
 * Features:
 * - Responsive card layout with image
 * - Category badge and rating display
 * - Truncated description with line clamping
 * - Click/keyboard navigation to business detail page
 * - Lazy loading for images (performance optimization)
 * - Full accessibility support (ARIA labels, keyboard navigation)
 * 
 * Visual Elements:
 * - Business image (top)
 * - Category badge (left) and rating (right)
 * - Business name as heading
 * - Description preview (2 lines max)
 * - "View Details" action button
 * 
 * Interaction:
 * - Click anywhere on card to view full business details
 * - Enter or Space key also triggers navigation
 * - Updates URL hash to #/business/:id
 * 
 * @module components/businessCard
 * @param {Object} business - Business object containing all business data
 * @param {number} business.id - Unique business identifier
 * @param {string} business.name - Business name
 * @param {string} business.category - Business category (e.g., "Fitness Center")
 * @param {number} business.rating - Rating from 0-5
 * @param {string} business.description - Full business description
 * @param {string} business.image - Image filename or URL
 * @returns {HTMLElement} Complete business card DOM element
 */

export function businessCard(business) {
  // Create card container element
  const card = document.createElement('div')
  card.className = "business-card"
  
  // Accessibility: Mark as article for semantic structure
  card.setAttribute('role', 'article')
  card.setAttribute('aria-label', `View details for ${business.name}`)

  // Handle both absolute URLs and relative asset paths
  const imageUrl = business.image.startsWith('http') ? business.image : `/assets/${business.image}`
  card.innerHTML = `
    <img src="${imageUrl}" alt="${business.name}" loading="lazy">
    <div class="mt-sm">
      <div class="flex-between mb-sm">
        <span class="badge badge-light">${business.category}</span>
        <span class="text-warning font-bold">★ ${business.rating}</span>
      </div>
      <h3 class="mb-sm">${business.name}</h3>
      <p class="text-light text-sm mb-md line-clamp-2">${business.description}</p>
      <button class="button button-outline w-full">View Details</button>
    </div>
  `

  /**
   * Click Handler - Navigate to Business Detail Page
   * 
   * When user clicks anywhere on the card, navigate to that business's full detail page.
   * Uses hash-based routing for SPA navigation (no page reload).
   */
  card.onclick = () => {
    location.hash = `#/business/${business.id}`
  }

  /**
   * Keyboard Accessibility
   * 
   * Make card keyboard-navigable for accessibility:
   * - tabIndex=0 allows keyboard focus
   * - Enter or Space key triggers navigation
   * - Meets WCAG 2.1 AA standards for keyboard access
   */
  card.tabIndex = 0
  card.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault() // Prevent page scroll on Space
      location.hash = `#/business/${business.id}`
    }
  }

  return card
}
