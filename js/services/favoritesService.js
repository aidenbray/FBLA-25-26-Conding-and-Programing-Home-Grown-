/**
 * Favorites Service Module
 * 
 * Manages user's favorite/bookmarked businesses using localStorage.
 * Provides functions to add, remove, and retrieve favorites.
 * 
 * Storage Format:
 * - Key: 'favorites'
 * - Value: JSON array of business IDs
 * - Example: [1, 3, 7, 12]
 * 
 * @module services/favoritesService
 */

/**
 * Save Business to Favorites
 * 
 * Adds a business ID to the user's favorites list.
 * Prevents duplicates - will not add if already favorited.
 * 
 * @function
 * @export
 * @param {string|number} id - Business ID to add to favorites
 */
export function saveFavorite(id) {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  if (!favorites.includes(id)) {
    favorites.push(id)
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }
}

/**
 * Remove Business from Favorites
 * 
 * Removes a business ID from the user's favorites list.
 * 
 * @function
 * @export
 * @param {string|number} id - Business ID to remove from favorites
 */
export function removeFavorite(id) {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  const updated = favorites.filter(favId => favId !== id)
  localStorage.setItem('favorites', JSON.stringify(updated))
}

/**
 * Get All Favorites
 * 
 * Retrieves the complete list of favorited business IDs.
 * 
 * @function
 * @export
 * @returns {Array<string|number>} Array of business IDs
 */
export function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]')
}

/**
 * Check if Business is Favorited
 * 
 * Determines whether a specific business is in the favorites list.
 * 
 * @function
 * @export
 * @param {string|number} id - Business ID to check
 * @returns {boolean} True if business is favorited
 */
export function isFavorite(id) {
  const favorites = getFavorites()
  return favorites.includes(id)
}
