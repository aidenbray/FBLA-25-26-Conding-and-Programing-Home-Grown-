/**
 * Navigation Component Module
 * 
 * Provides a global navigation bar for easy access to main sections of the app.
 * Supports highlighting the current active page and responsive mobile menu.
 * 
 * Key Features:
 * - Sticky navigation bar at top of page
 * - Active page highlighting
 * - Links to Home, Favorites, Admin, and Judge pages
 * - Favorites counter badge
 * - Responsive design with mobile considerations
 * 
 * @module components/navigation
 * @requires services/favoritesService - Get favorites count
 */

import { getFavorites } from '../services/favoritesService.js'

/**
 * Create Navigation Bar Component
 * 
 * Generates a navigation bar with links to main pages.
 * Highlights the currently active page based on URL hash.
 * 
 * @function
 * @export
 * @returns {string} HTML string for navigation bar
 */
export function createNavigation() {
  const currentHash = window.location.hash || '#/home'
  const favoritesCount = getFavorites().length
  
  return `
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <a href="#/home" class="navbar-logo">
            <span class="logo-icon">🏪</span>
            <span class="logo-text">Byte-Sized Business Boost</span>
          </a>
        </div>
        
        <ul class="navbar-menu">
          <li class="navbar-item">
            <a href="#/home" class="navbar-link ${currentHash === '#/home' ? 'active' : ''}">
              Home
            </a>
          </li>
          <li class="navbar-item">
            <a href="#/favorites" class="navbar-link ${currentHash === '#/favorites' ? 'active' : ''}">
              Favorites
              ${favoritesCount > 0 ? `<span class="navbar-badge">${favoritesCount}</span>` : ''}
            </a>
          </li>
          <li class="navbar-item">
            <a href="#/admin" class="navbar-link ${currentHash === '#/admin' ? 'active' : ''}">
              Admin
            </a>
          </li>
          <li class="navbar-item">
            <a href="#/judge" class="navbar-link ${currentHash === '#/judge' ? 'active' : ''}">
              Judge
            </a>
          </li>
        </ul>
      </div>
    </nav>
  `
}

/**
 * Update Navigation Badge
 * 
 * Updates the favorites counter badge without re-rendering entire nav.
 * Useful for real-time updates when favorites are added/removed.
 * 
 * @function
 * @export
 */
export function updateFavoritesBadge() {
  const favoritesLink = document.querySelector('a[href="#/favorites"]')
  if (!favoritesLink) return
  
  const favoritesCount = getFavorites().length
  let badge = favoritesLink.querySelector('.navbar-badge')
  
  if (favoritesCount > 0) {
    if (badge) {
      badge.textContent = favoritesCount
    } else {
      badge = document.createElement('span')
      badge.className = 'navbar-badge'
      badge.textContent = favoritesCount
      favoritesLink.appendChild(badge)
    }
  } else if (badge) {
    badge.remove()
  }
}

/**
 * Highlight Active Navigation Link
 * 
 * Updates the active state of navigation links based on current route.
 * Called automatically on route changes.
 * 
 * @function
 * @export
 */
export function updateActiveNavLink() {
  const currentHash = window.location.hash || '#/home'
  const links = document.querySelectorAll('.navbar-link')
  
  links.forEach(link => {
    const href = link.getAttribute('href')
    if (href === currentHash) {
      link.classList.add('active')
    } else {
      link.classList.remove('active')
    }
  })
}
