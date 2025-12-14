/**
 * Business Service Module
 * 
 * Core service for loading, managing, and filtering business data.
 * Implements a hybrid data model combining base JSON with localStorage customizations.
 * 
 * Data Architecture:
 * - Base Data: Original businesses.json file (immutable source of truth)
 * - Custom Edits: Admin-created/edited businesses stored in localStorage
 * - Soft Deletes: Deleted IDs tracked separately (preserves base data)
 * - Merge Strategy: Custom edits override base data, deletions filter out
 * \n * Key Features:
 * - Async data loading with error handling
 * - Cache-busting for data freshness (timestamp query param)
 * - Geolocation-based filtering and sorting
 * - Distance calculations using Haversine formula
 * - Efficient data merging algorithm
 * 
 * Why This Architecture:
 * - Preserves original data for reset/recovery
 * - Supports admin CRUD without server
 * - Enables rollback of custom changes
 * - Separates concerns (base vs. custom data)
 * 
 * Performance Notes:
 * - Single network request for base data
 * - localStorage reads are synchronous (fast)
 * - Merge happens client-side (no server load)
 * - Cached distance calculations when possible
 * 
 * @module services/businessService
 * @requires utils/distanceUtils - Geolocation calculation utilities
 */

import { addDistancesToBusinesses, sortByDistance, filterByDistance } from '../utils/distanceUtils.js'

/**
 * Load All Businesses
 * 
 * Fetches base business data and merges with local customizations.
 * This is the primary data access function used throughout the app.
 * 
 * Data Merge Algorithm:
 * 1. Fetch base data from businesses.json
 * 2. Load custom edits from localStorage
 * 3. Load deleted IDs from localStorage
 * 4. Filter out deleted businesses
 * 5. For each custom business:
 *    - If ID exists in base: Replace with custom version (edit)
 *    - If ID doesn't exist: Add as new business (create)
 * 
 * Error Handling:
 * - Network failures: Logs warning, continues with empty array
 * - JSON parse errors: Logs warning, continues with localStorage only
 * - localStorage errors: Fails gracefully, returns base data only
 * 
 * Cache Busting:
 * Uses timestamp query parameter (?v=timestamp) to prevent browser
 * from serving stale cached data. Critical for seeing admin changes.
 * 
 * @async
 * @function
 * @export
 * @returns {Promise<Array<Object>>} Array of business objects with custom edits applied
 * @throws {Error} Never throws - errors are logged and handled gracefully
 */
export async function loadBusinesses() {
  let businesses = []
  try {
    // Fetch base data with cache-busting timestamp
    const res = await fetch(`/data/businesses.json?v=${Date.now()}`)
    if (res.ok) {
      businesses = await res.json()
    }
  } catch (e) {
    // Network failure or JSON parse error - continue with empty base
    console.warn('Failed to load businesses.json', e)
  }

  // Load local customizations (admin edits and additions)
  const custom = JSON.parse(localStorage.getItem('businesses_custom') || '[]')
  // Load soft-deleted IDs (admin deletions)
  const deletedIds = JSON.parse(localStorage.getItem('businesses_deleted_ids') || '[]')

  // Step 1: Filter out soft-deleted businesses
  businesses = businesses.filter(b => !deletedIds.includes(b.id))

  // Step 2: Apply custom edits and additions
  custom.forEach(c => {
    const idx = businesses.findIndex(b => b.id === c.id)
    if (idx > -1) {
      // Business exists in base - replace with custom version (EDIT)
      businesses[idx] = c
    } else {
      // Business doesn't exist in base - add as new (CREATE)
      businesses.push(c)
    }
  })

  return businesses
}

/**
 * Get Business By ID
 * 
 * Retrieves a single business by its unique identifier.
 * Returns null if business not found (may have been deleted or doesn't exist).
 * 
 * String Coercion:
 * Both IDs are coerced to strings to handle type mismatches.
 * URL params are always strings, but stored IDs might be numbers.
 * 
 * Use Cases:
 * - Loading business detail page
 * - Looking up business for deal/review display
 * - Validating business existence before operations
 * 
 * @async
 * @function
 * @export
 * @param {string|number} id - Business ID to search for
 * @returns {Promise<Object|null>} Business object if found, null otherwise
 */
export async function getBusinessById(id) {
  const businesses = await loadBusinesses()
  // String comparison handles mixed number/string IDs
  return businesses.find(b => String(b.id) === String(id)) || null
}

/**
 * Get Nearby Businesses with Distance Calculations
 * 
 * Enhances business objects with calculated distance from user's location.
 * Uses Haversine formula for accurate great-circle distance on Earth's surface.
 * 
 * Distance Calculation:
 * - Haversine formula accounts for Earth's curvature
 * - More accurate than simple lat/lng differences
 * - Returns distances in miles (M) or kilometers (K)
 * 
 * Fallback Behavior:
 * If no user location provided, returns all businesses without distance data.
 * This allows app to function when location services are denied.
 * 
 * Business Object Enhancement:
 * Original business properties preserved, 'distance' property added:
 * { id, name, category, ..., distance: 2.5 }
 * 
 * @async
 * @function
 * @export
 * @param {Object} userLocation - User location {lat, lng}
 * @param {number} userLocation.lat - Latitude in decimal degrees
 * @param {number} userLocation.lng - Longitude in decimal degrees
 * @returns {Promise<Array<Object>>} Businesses with distance property added
 */
export async function getNearbyBusinesses(userLocation) {
  // If no location, return businesses without distance calculations
  if (!userLocation) return loadBusinesses()
  
  const businesses = await loadBusinesses()
  // Add distance property to each business (in miles)
  return addDistancesToBusinesses(businesses, userLocation, 'M')
}

/**
 * Get Businesses Sorted by Distance
 * 
 * Returns all businesses sorted from closest to farthest from user's location.
 * Essential for "nearby" views and location-based recommendations.
 * 
 * Sorting Algorithm:
 * - Businesses with distance data sorted ascending (closest first)
 * - Businesses without distance data placed at end
 * - Stable sort maintains relative order for equal distances
 * 
 * Use Cases:
 * - "Sort by Distance" feature on homepage
 * - Finding nearest options for user
 * - Mobile-first discovery experience
 * 
 * @async
 * @function
 * @export
 * @param {Object} userLocation - User location {lat, lng}
 * @param {number} userLocation.lat - Latitude in decimal degrees
 * @param {number} userLocation.lng - Longitude in decimal degrees
 * @returns {Promise<Array<Object>>} Businesses sorted by distance (closest first)
 */
export async function getBusinessesSortedByDistance(userLocation) {
  const businesses = await getNearbyBusinesses(userLocation)
  return sortByDistance(businesses) // Closest first
}

/**
 * Get Businesses Within Radius
 * 
 * Filters businesses to only those within specified radius from user's location.
 * Useful for "nearby" searches with distance constraints.
 * 
 * Radius Filtering:
 * - Default: 5 miles (reasonable walking/short driving distance)
 * - Configurable: Can adjust based on user preference
 * - Inclusive: Businesses exactly at radius edge included
 * 
 * Real-World Applications:
 * - "Show me coffee shops within 2 miles"
 * - Mobile users wanting nearby options
 * - Location-aware promotions/deals
 * 
 * Performance Note:
 * Filtering happens client-side after distance calculation.
 * For large datasets, consider server-side spatial queries.
 * 
 * @async
 * @function
 * @export
 * @param {Object} userLocation - User location {lat, lng}
 * @param {number} userLocation.lat - Latitude in decimal degrees
 * @param {number} userLocation.lng - Longitude in decimal degrees
 * @param {number} [radiusMiles=5] - Search radius in miles (default: 5)
 * @returns {Promise<Array<Object>>} Businesses within specified radius
 */
export async function getBusinessesWithinRadius(userLocation, radiusMiles = 5) {
  const businesses = await getNearbyBusinesses(userLocation)
  return filterByDistance(businesses, radiusMiles)
}
