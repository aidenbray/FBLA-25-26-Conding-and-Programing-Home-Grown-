// /js/components/locationSearch.js
import { formatDistance } from '../utils/distanceUtils.js'

/**
 * Create a location search component with distance filtering
 * @param {Array} businesses - Array of businesses with distance property
 * @param {Object} userLocation - User location {lat, lng}
 * @param {Function} onFilter - Callback when filter radius changes
 * @returns {HTMLElement} Component element
 */
export function locationSearch(businesses, userLocation, onFilter) {
  const container = document.createElement('div');
  container.className = 'location-search-container mb-md';

  if (!userLocation) {
    container.innerHTML = `
      <div class="location-disabled">
        <p class="text-muted">Enable location services to find nearby businesses</p>
      </div>
    `;
    return container;
  }

  const nearbyCount = businesses.filter(b => b.distance && b.distance <= 5).length;
  
  container.innerHTML = `
    <div class="location-search">
      <div class="location-info flex-between">
        <div class="location-status">
          <span class="status-icon">📍</span>
          <span class="status-text">Location enabled • <strong>${nearbyCount}</strong> businesses nearby</span>
        </div>
        <div class="radius-control">
          <label for="radius-slider" class="sr-only">Search radius in miles</label>
          <input 
            type="range" 
            id="radius-slider" 
            class="radius-slider"
            min="0.5" 
            max="25" 
            step="0.5" 
            value="5"
            aria-label="Search radius"
          >
          <span class="radius-value"><strong id="radius-display">5</strong> mi</span>
        </div>
      </div>
      <div class="sort-by-distance">
        <button id="sort-distance-btn" class="button button-sm button-outline" aria-label="Sort by distance">
          ↕️ Sort by Distance
        </button>
      </div>
    </div>
  `;

  const radiusSlider = container.querySelector('#radius-slider');
  const radiusDisplay = container.querySelector('#radius-display');
  const sortBtn = container.querySelector('#sort-distance-btn');

  radiusSlider.addEventListener('input', (e) => {
    const radius = parseFloat(e.target.value);
    radiusDisplay.textContent = radius;
    if (onFilter) {
      onFilter(radius);
    }
  });

  sortBtn.addEventListener('click', () => {
    if (onFilter) {
      onFilter('sort-distance');
    }
  });

  return container;
}

/**
 * Create a business card with distance display
 * @param {Object} business - Business object with distance property
 * @returns {HTMLElement} Business card with distance
 */
export function businessCardWithDistance(business) {
  const card = document.createElement('div');
  card.className = 'business-card';
  
  const distanceHtml = business.distance !== undefined
    ? `<div class="business-distance">${formatDistance(business.distance, 'M', 1)} away</div>`
    : '';

  const addressHtml = business.address
    ? `<div class="business-address" title="${business.address}">${business.address}</div>`
    : '';

  const phoneHtml = business.phone
    ? `<div class="business-phone">${business.phone}</div>`
    : '';

  card.innerHTML = `
    <div class="card-header">
      <h3>${business.name}</h3>
      <span class="rating-badge">${business.rating}★</span>
    </div>
    <div class="card-body">
      <p class="category">${business.category} • ${business.subcategory}</p>
      <p class="description">${business.description}</p>
      ${addressHtml}
      ${phoneHtml}
    </div>
    <div class="card-footer">
      ${distanceHtml}
      <a href="#/business/${business.id}" class="button button-sm">View Details</a>
    </div>
  `;

  return card;
}

/**
 * Create a location permission prompt
 * @param {Function} onRequestPermission - Callback when user requests permission
 * @returns {HTMLElement} Permission prompt element
 */
export function locationPermissionPrompt(onRequestPermission) {
  const prompt = document.createElement('div');
  prompt.className = 'location-permission-prompt alert alert-info mb-md';

  prompt.innerHTML = `
    <div class="flex-between">
      <div>
        <strong>Find Nearby Businesses</strong>
        <p class="text-muted" style="margin: 0.5rem 0 0 0;">We can help you discover local businesses close to you!</p>
      </div>
      <button id="enable-location-btn" class="button button-sm">Enable Location</button>
    </div>
  `;

  prompt.querySelector('#enable-location-btn').addEventListener('click', () => {
    if (onRequestPermission) {
      onRequestPermission();
    }
    // Remove prompt after user clicks
    prompt.style.display = 'none';
  });

  return prompt;
}

/**
 * Create a location loading indicator
 * @returns {HTMLElement} Loading element
 */
export function locationLoadingIndicator() {
  const loader = document.createElement('div');
  loader.className = 'location-loader mb-md';
  loader.innerHTML = `
    <div class="spinner"></div>
    <p>Getting your location...</p>
  `;
  return loader;
}
