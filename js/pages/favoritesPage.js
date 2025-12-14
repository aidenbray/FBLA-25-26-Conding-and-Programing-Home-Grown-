/**
 * Favorites Page Module
 * 
 * Displays all businesses that the user has bookmarked/favorited.
 * Provides easy access to saved businesses with ability to remove favorites.
 * 
 * Key Features:
 * - Grid view of all favorited businesses
 * - Remove from favorites functionality
 * - Empty state with helpful messaging
 * - Uses same business card component for consistency
 * - Real-time updates when favorites are modified
 * 
 * @module pages/favoritesPage
 * @requires services/favoritesService - Favorites management
 * @requires services/businessService - Business data loading
 * @requires components/businessCard - Business card UI component
 */

import { getFavorites, removeFavorite } from '../services/favoritesService.js'
import { loadBusinesses } from '../services/businessService.js'
import { businessCard } from '../components/businessCard.js'

/**
 * Load and Render Favorites Page
 * 
 * Main entry point for the favorites page. Displays all bookmarked businesses
 * in a grid layout with ability to remove items from favorites.
 * 
 * Page Structure:
 * - Header with back button
 * - Grid of favorite businesses or empty state
 * - Remove buttons on each business card
 * 
 * @async
 * @function
 * @export
 * @returns {Promise<void>}
 */
export async function loadFavoritesPage() {
  const app = document.getElementById('app')
  
  // Get favorite IDs and all businesses
  const favoriteIds = getFavorites()
  const allBusinesses = await loadBusinesses()
  
  // Filter businesses to only show favorites
  const favoriteBusinesses = allBusinesses.filter(business => 
    favoriteIds.includes(business.id)
  )
  
  // Render page structure
  app.innerHTML = `
    <div class="container mt-lg">
      <div class="flex-between mb-lg">
        <h1>My Favorites</h1>
        <button id="back-btn" class="button button-secondary">
          <span>← Back</span>
        </button>
      </div>
      
      ${favoriteBusinesses.length === 0 ? `
        <div class="empty-state text-center py-2xl">
          <div class="empty-state-icon mb-md">🔖</div>
          <h2 class="mb-sm">No Favorites Yet</h2>
          <p class="text-light mb-lg">
            Start bookmarking businesses you love to see them here!
          </p>
          <a href="#/home" class="button button-primary">
            Discover Businesses
          </a>
        </div>
      ` : `
        <p class="text-light mb-md">
          You have ${favoriteBusinesses.length} bookmarked ${favoriteBusinesses.length === 1 ? 'business' : 'businesses'}
        </p>
        <div id="favorites-grid" class="grid grid-cols-3"></div>
      `}
    </div>
  `
  
  // Add event listener for back button
  const backBtn = document.getElementById('back-btn')
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/home'
    })
  }
  
  // Render business cards if there are favorites
  if (favoriteBusinesses.length > 0) {
    renderFavoriteBusinesses(favoriteBusinesses)
  }
}

/**
 * Render Favorite Businesses
 * 
 * Creates business cards for each favorite with an additional
 * "Remove from Favorites" button.
 * 
 * @function
 * @private
 * @param {Array<Object>} businesses - Array of favorite business objects
 */
function renderFavoriteBusinesses(businesses) {
  const grid = document.getElementById('favorites-grid')
  
  businesses.forEach(business => {
    // Create business card
    const card = businessCard(business)
    
    // Add remove button to card
    const removeBtn = document.createElement('button')
    removeBtn.className = 'button button-outline button-small mt-sm'
    removeBtn.textContent = 'Remove from Favorites'
    removeBtn.style.width = '100%'
    
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Remove from favorites
      removeFavorite(business.id)
      
      // Show feedback
      card.style.opacity = '0.5'
      removeBtn.textContent = 'Removed!'
      removeBtn.disabled = true
      
      // Reload page after brief delay
      setTimeout(() => {
        loadFavoritesPage()
      }, 500)
    })
    
    card.appendChild(removeBtn)
    grid.appendChild(card)
  })
}
