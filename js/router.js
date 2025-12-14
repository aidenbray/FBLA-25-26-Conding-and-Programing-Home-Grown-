/**
 * Client-Side Router Module
 * 
 * Implements a hash-based Single Page Application (SPA) routing system.
 * Uses URL hash fragments to navigate between pages without full page reloads.
 * 
 * Routing Strategy:
 * - Hash-based routing (#/home, #/business/123, #/admin, #/judge)
 * - Prevents page reloads for faster navigation
 * - Maintains browser history (back/forward buttons work)
 * - Enables deep linking (users can bookmark specific pages)
 * 
 * Supported Routes:
 * - #/home - Main homepage with business listings and search
 * - #/business/:id - Individual business detail page
 * - #/admin - Admin dashboard (requires authentication)
 * - #/judge - Judge evaluation page for FBLA judging
 * 
 * URL Structure:
 * - Format: #/route/parameter
 * - Example: #/business/123 where '123' is the business ID
 * 
 * @module router
 * @requires ./pages/homePage.js - Homepage component
 * @requires ./pages/businessPage.js - Business detail page component
 * @requires ./pages/adminPage.js - Admin dashboard component
 * @requires ./pages/judgePage.js - Judge evaluation component
 */

import { loadHomePage } from './pages/homePage.js'
import { loadBusinessPage } from './pages/businessPage.js'
import { loadFavoritesPage } from './pages/favoritesPage.js'
import { renderAdminPage } from './pages/adminPage.js'
import { renderJudgePage } from './pages/judgePage.js'
import { createNavigation, updateActiveNavLink, updateFavoritesBadge } from './components/navigation.js'

/**
 * Route Configuration Object
 * 
 * Maps route names to their corresponding page rendering functions.
 * Each function is responsible for rendering its page content into the #app container.
 * 
 * Route Functions:
 * - home: Renders business listings, search, and recommendations
 * - business: Renders individual business details (requires ID parameter)
 * - favorites: Renders user's bookmarked businesses
 * - admin: Renders admin dashboard with data management tools
 * - judge: Renders judging interface for FBLA evaluation
 * 
 * @constant {Object.<string, Function>}
 */
const routes = {
  home: loadHomePage,        // Homepage with business discovery
  business: loadBusinessPage, // Individual business details
  favorites: loadFavoritesPage, // User's favorited businesses
  admin: renderAdminPage,     // Admin dashboard
  judge: renderJudgePage      // Judge evaluation interface
}

/**
 * Render Navigation
 * 
 * Inserts or updates the navigation bar at the top of the page.
 * Creates a new nav element if it doesn't exist.
 * 
 * @function
 * @private
 */
function renderNavigation() {
  let navContainer = document.getElementById('nav-container')
  
  if (!navContainer) {
    navContainer = document.createElement('div')
    navContainer.id = 'nav-container'
    document.body.insertBefore(navContainer, document.body.firstChild)
  }
  
  navContainer.innerHTML = createNavigation()
}

/**
 * Route Handler Function
 * 
 * Parses the current URL hash and renders the appropriate page component.
 * Handles both simple routes (e.g., #/home) and parameterized routes (e.g., #/business/123).
 * Also updates navigation bar to reflect current page.
 * 
 * URL Parsing Logic:
 * 1. Extracts hash from window.location.hash (e.g., "#/business/123")
 * 2. Removes "#/" prefix to get route path ("business/123")
 * 3. Splits by "/" to separate route name and parameters
 * 4. Matches route name to route configuration
 * 5. Calls appropriate render function with parameters
 * 6. Updates navigation active state and badges
 * 
 * Fallback Behavior:
 * - If no hash exists, defaults to #/home
 * - If route doesn't match any defined routes, falls back to home page
 * - If business route is missing ID parameter, returns to home
 * 
 * Examples:
 * - "#/home" → loads home page
 * - "#/business/123" → loads business page with ID "123"
 * - "#/favorites" → loads favorites page
 * - "#/admin" → loads admin page
 * - "#/judge" → loads judge page
 * - "" (empty) → defaults to home page
 * 
 * @function
 * @private
 */
function handleRoute() {
  // Render/update navigation
  renderNavigation()
  
  // Get current hash or default to home page
  // Example: "#/business/123" or default "#/home"
  const hash = window.location.hash || '#/home'
  
  // Remove "#/" prefix and split into route components
  // Example: "#/business/123" → ["business", "123"]
  const parts = hash.slice(2).split('/')

  // Extract route name and optional parameter
  const route = parts[0]      // Example: "business"
  const param = parts[1] || null // Example: "123" or null

  // Special handling for business route which requires an ID parameter
  if (route === 'business' && param) {
    // Load business detail page with specific business ID
    routes.business(param)
  } else if (routes[route]) {
    // Load the corresponding page if route exists
    routes[route]()
  } else {
    // For invalid routes, default to home page
    // TODO: Add 404 page for invalid routes
    routes.home()
  }
  
  // Update navigation state after route loads
  updateActiveNavLink()
  updateFavoritesBadge()
}

/**
 * Router Initialization Function
 * 
 * Sets up the routing system by:
 * 1. Listening for hash changes (when user navigates using browser buttons or links)
 * 2. Handling the initial route when page first loads
 * 
 * Event Listener:
 * - 'hashchange' fires whenever the URL hash changes
 * - Enables back/forward button functionality
 * - Triggered by clicking hash links (<a href="#/home">)
 * 
 * Initial Route Handling:
 * - Calls handleRoute() immediately to render the current page
 * - Essential for handling direct navigation to specific URLs
 * - Example: User visits "yoursite.com/#/business/123" directly
 * 
 * @function
 * @export
 * @public
 */
export function initRouter() {
  // Listen for hash changes (browser navigation, link clicks)
  window.addEventListener('hashchange', handleRoute)
  
  // Handle initial route on page load
  // Ensures correct page is displayed when user first visits or refreshes
  handleRoute()
}
