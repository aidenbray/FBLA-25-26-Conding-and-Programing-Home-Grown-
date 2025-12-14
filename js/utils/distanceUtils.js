// /js/utils/distanceUtils.js

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @param {string} unit - 'M' for miles, 'K' for kilometers (default: 'M')
 * @returns {number} Distance in the specified unit
 */
export function calculateDistance(lat1, lon1, lat2, lon2, unit = 'M') {
  const R = unit === 'K' ? 6371 : 3959; // Earth's radius in km or miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param {number} distance - Distance value
 * @param {string} unit - 'M' for miles, 'K' for kilometers
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted distance string
 */
export function formatDistance(distance, unit = 'M', decimals = 1) {
  const rounded = Math.round(distance * Math.pow(10, decimals)) / Math.pow(10, decimals);
  const unitStr = unit === 'K' ? 'km' : 'mi';
  return `${rounded} ${unitStr}`;
}

/**
 * Get all businesses with calculated distances from a user location
 * @param {Array} businesses - Array of business objects
 * @param {Object} userLocation - User location {lat, lng}
 * @param {string} unit - 'M' for miles, 'K' for kilometers
 * @returns {Array} Businesses with added 'distance' property
 */
export function addDistancesToBusinesses(businesses, userLocation, unit = 'M') {
  if (!userLocation) return businesses;

  return businesses.map(business => ({
    ...business,
    distance: calculateDistance(
      userLocation.lat,
      userLocation.lng,
      business.latitude,
      business.longitude,
      unit
    )
  }));
}

/**
 * Filter businesses by distance radius
 * @param {Array} businesses - Array of business objects (with distance property)
 * @param {number} radiusInMiles - Radius in miles
 * @returns {Array} Filtered businesses
 */
export function filterByDistance(businesses, radiusInMiles = 5) {
  return businesses.filter(b => b.distance && b.distance <= radiusInMiles);
}

/**
 * Sort businesses by distance (closest first)
 * @param {Array} businesses - Array of business objects (with distance property)
 * @returns {Array} Sorted businesses
 */
export function sortByDistance(businesses) {
  return [...businesses].sort((a, b) => {
    if (a.distance === undefined) return 1;
    if (b.distance === undefined) return -1;
    return a.distance - b.distance;
  });
}
