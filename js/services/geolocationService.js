// /js/services/geolocationService.js

let cachedUserLocation = null;
const LOCATION_CACHE_KEY = 'user_location_cache';
const LOCATION_CACHE_TTL = 3600000; // 1 hour

/**
 * Request user's geolocation with permissions
 * @returns {Promise<{lat: number, lng: number, accuracy: number}|null>}
 */
export async function getUserLocation() {
  // Check if we have a cached location
  const cached = getCachedLocation();
  if (cached) {
    return cached;
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const location = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy
        };
        
        // Cache the location
        cacheLocation(location);
        cachedUserLocation = location;
        
        console.log('User location obtained:', location);
        resolve(location);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        // Return null on error, not a rejection
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Get cached location if still valid
 * @returns {Object|null}
 */
function getCachedLocation() {
  try {
    const stored = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!stored) return null;

    const cached = JSON.parse(stored);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - cached.timestamp < LOCATION_CACHE_TTL) {
      return cached.location;
    }
    
    // Clear expired cache
    localStorage.removeItem(LOCATION_CACHE_KEY);
    return null;
  } catch (e) {
    console.warn('Error reading cached location:', e);
    return null;
  }
}

/**
 * Store location in cache
 * @param {Object} location - The location object with lat, lng, accuracy
 */
function cacheLocation(location) {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
      location,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Error caching location:', e);
  }
}

/**
 * Clear cached location
 */
export function clearCachedLocation() {
  localStorage.removeItem(LOCATION_CACHE_KEY);
  cachedUserLocation = null;
}

/**
 * Request permission to use geolocation (for browsers that support it)
 * @returns {Promise<boolean>}
 */
export async function requestLocationPermission() {
  if (!navigator.geolocation) {
    return false;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { timeout: 5000 }
    );
  });
}

/**
 * Get a default location (useful for testing)
 * @returns {Object}
 */
export function getDefaultLocation() {
  return {
    lat: 40.7128,
    lng: -74.0060,
    accuracy: 1000
  };
}
