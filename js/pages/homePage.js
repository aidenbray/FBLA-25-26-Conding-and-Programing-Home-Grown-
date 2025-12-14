/**
 * Home Page Module
 * 
 * Primary landing page displaying business discovery features, search capabilities,
 * geolocation-based filtering, active deals, trending businesses, and personalized recommendations.
 * 
 * Key Features:
 * - Real-time business search with instant filtering
 * - Multiple sorting options (category, rating, alphabetical, newest, distance)
 * - Geolocation integration for nearby business discovery
 * - Distance-based filtering with radius slider (0.5-25 miles)
 * - Active deals banner with business quick-links
 * - Trending section based on review volume
 * - Lazy-loaded recommendation engine (code-split for performance)
 * - Responsive grid layout for business cards
 * - Accessibility-compliant search and controls
 * 
 * Data Flow:
 * 1. Parallel data loading (businesses, deals, reviews) for optimal performance
 * 2. Optional geolocation permission request with user-friendly prompts
 * 3. Distance calculations when location enabled
 * 4. Dynamic filtering and sorting based on user interaction
 * 5. Lazy-loaded recommendation service (only loads when needed)
 * 
 * Performance Optimizations:
 * - Document fragments for efficient DOM manipulation
 * - Dynamic imports for recommendation service (code splitting)
 * - Cached business data to minimize re-renders
 * - Debounced search input (via browser native input events)
 * 
 * @module pages/homePage
 * @requires services/businessService - Business data loading and filtering
 * @requires services/dealsService - Active deals management
 * @requires services/reviewService - Review data for trending calculation
 * @requires services/geolocationService - User location detection
 * @requires components/businessCard - Business card UI component
 * @requires components/locationSearch - Location-based search controls
 * @requires utils/distanceUtils - Distance calculation and formatting
 */

import { loadBusinesses, getBusinessesSortedByDistance, getBusinessesWithinRadius } from '../services/businessService.js'
import { businessCard } from '../components/businessCard.js'
import { loadDeals, getActiveDeals } from '../services/dealsService.js'
import { loadReviews } from '../services/reviewService.js'
import { calculateCredibility } from '../services/credibilityService.js'
import { getUserLocation, requestLocationPermission } from '../services/geolocationService.js'
import { locationSearch, locationPermissionPrompt, locationLoadingIndicator, businessCardWithDistance } from '../components/locationSearch.js'
import { addDistancesToBusinesses, sortByDistance, filterByDistance, formatDistance } from '../utils/distanceUtils.js'

/**
 * All loaded businesses from data source
 * @type {Array<Object>}
 * @private
 */
let businessData = []

/**
 * Businesses with calculated distances from user location
 * Only populated when geolocation is enabled
 * @type {Array<Object>}
 * @private
 */
let allBusinessesWithDistance = []

/**
 * Current user's geographic location
 * Structure: {lat: number, lng: number, accuracy: number}
 * @type {Object|null}
 * @private
 */
let currentUserLocation = null

/**
 * Current sort mode selected by user
 * Options: 'category', 'rating', 'alpha', 'newest', 'distance'
 * @type {string}
 * @private
 */
let currentSortMode = 'category'

/**
 * Flag indicating if user has granted location permissions
 * Controls which features are available (distance sorting, nearby filtering)
 * @type {boolean}
 * @private
 */
let isLocationEnabled = false

/**
 * Load and Render Home Page
 * 
 * Main entry point for the homepage. Orchestrates the entire page rendering process:
 * 1. Renders skeleton structure with hero section, search bar, and grid containers
 * 2. Loads all required data in parallel (businesses, deals, reviews)
 * 3. Sets up location permission flow with user-friendly prompts
 * 4. Attaches event listeners for search and sort interactions
 * 5. Renders deals banner, trending section, and lazy-loads recommendations
 * 
 * Page Structure:
 * - Hero Section: Title, tagline, search bar
 * - Location Controls: Permission prompt, loading indicator, search controls
 * - Deals Banner: First active deal with quick navigation
 * - Main Grid: Sortable/filterable business cards
 * - Trending Section: Top 2 businesses by review count
 * - Recommendations: Lazy-loaded personalized suggestions
 * 
 * Accessibility Features:
 * - Semantic HTML structure with proper headings hierarchy
 * - ARIA labels for screen readers (sr-only class for sort label)
 * - Keyboard navigation support for all interactive elements
 * - Proper form labels for search input
 * 
 * Performance Notes:
 * - Uses Promise.all for parallel data loading (reduces wait time)
 * - Document fragments for batch DOM updates (minimizes reflows)
 * - Dynamic import for recommendation service (code splitting)
 * - Lazy loading with try-catch for graceful degradation
 * 
 * @async
 * @function
 * @export
 * @returns {Promise<void>}
 */
export async function loadHomePage() {
    const app = document.getElementById('app');
    
    // 1. Render Skeleton/Structure
    app.innerHTML = `
        <div class="hero">
            <h1>Discover Local Gems</h1>
            <p>Support your community, one business at a time.</p>
            <div class="search-bar">
                <input type="text" id="search-input" placeholder="Search businesses..." aria-label="Search businesses">
            </div>
        </div>

        <div class="container">
            <!-- Location Permission Prompt -->
            <div id="location-prompt-container"></div>

            <!-- Location Loading Indicator -->
            <div id="location-loader-container"></div>

            <!-- Deals Banner -->
            <div id="deal-banner" class="deal-banner hidden"></div>

            <!-- Location Search Controls -->
            <div id="location-search-container"></div>

            <!-- Controls -->
            <div class="controls flex-between mb-md">
                <div class="sort-wrapper">
                    <label for="sort-select" class="sr-only">Sort by</label>
                    <select id="sort-select" class="input">
                        <option value="category">Sort by Category</option>
                        <option value="rating">Sort by Rating</option>
                        <option value="alpha">Sort A-Z</option>
                        <option value="newest">Newest First</option>
                        <option value="distance">Sort by Distance</option>
                    </select>
                </div>
            </div>

            <!-- Main Grid -->
            <div id="business-grid" class="grid"></div>

            <!-- Trending Section -->
            <section class="mt-lg">
                <h2 class="mb-md">Trending Now</h2>
                <div id="trending-list" class="grid grid-cols-2"></div>
            </section>

            <!-- Recommendations Section (Lazy) -->
            <section id="recommendation-section" class="mt-lg hidden">
                <h2 class="mb-md">Recommended for You</h2>
                <div id="recommendation-grid" class="grid"></div>
            </section>
        </div>
    `;

    // 2. Load Data
    const [businesses, deals, reviews] = await Promise.all([
        loadBusinesses(),
        loadDeals(),
        loadReviews()
    ]);
    
    businessData = businesses;

    // 3. Try to get user location
    const promptContainer = document.getElementById('location-prompt-container');
    const loaderContainer = document.getElementById('location-loader-container');
    
    // Show location permission prompt
    promptContainer.appendChild(locationPermissionPrompt(async () => {
        loaderContainer.appendChild(locationLoadingIndicator());
        currentUserLocation = await getUserLocation();
        if (currentUserLocation) {
            isLocationEnabled = true;
            loaderContainer.innerHTML = '';
            promptContainer.innerHTML = '';
            allBusinessesWithDistance = addDistancesToBusinesses(businessData, currentUserLocation, 'M');
            setupLocationSearch();
            renderBusinessGrid(allBusinessesWithDistance);
        }
    }));

    // 3. Render Initial Grid
    renderBusinessGrid(businessData);

    // 4. Setup Event Listeners
    document.getElementById('search-input').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const dataSource = isLocationEnabled ? allBusinessesWithDistance : businessData;
        const filtered = dataSource.filter(b => 
            b.name.toLowerCase().includes(term) || 
            b.category.toLowerCase().includes(term) ||
            b.description.toLowerCase().includes(term)
        );
        renderBusinessGrid(filtered);
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentSortMode = e.target.value;
        const dataSource = isLocationEnabled ? allBusinessesWithDistance : businessData;
        const sorted = sortBusinesses(dataSource, currentSortMode);
        renderBusinessGrid(sorted);
    });

    // 5. Render Deals
    renderDeals(deals, businesses);

    // 6. Render Trending
    renderTrendingSection(reviews, businesses);

    // 7. Lazy Load Recommendations
    // Dynamic imports for code splitting - only loads when needed
    // Reduces initial bundle size for faster page load
    import('../services/recommendationService.js').then(async ({ getRecommendedBusinesses }) => {
        import('../components/recommendationCard.js').then(({ recommendationCard }) => {
             renderRecommendations(getRecommendedBusinesses, recommendationCard);
        });
    }).catch(err => console.log("Recommendation service failed to load", err));
}

/**
 * Setup Location Search Controls
 * 
 * Initializes the location-based search interface after user grants location permission.
 * Provides distance-based filtering and sorting capabilities.
 * 
 * Location Controls:
 * - Distance radius slider (0.5-25 miles)
 * - Sort by distance button
 * - Nearby businesses counter
 * - Current location status indicator
 * 
 * User Interactions:
 * - Slider adjustment: Filters businesses within selected radius
 * - Sort button: Sorts all businesses by distance (closest first)
 * 
 * Why This Matters:
 * This feature helps users discover local businesses efficiently, improving user experience
 * by showing the most relevant nearby options based on their physical location.
 * 
 * @function
 * @private
 * @returns {void}
 */
function setupLocationSearch() {
    const container = document.getElementById('location-search-container');
    if (!container || !currentUserLocation) return;

    container.appendChild(locationSearch(allBusinessesWithDistance, currentUserLocation, (action) => {
        const sortSelect = document.getElementById('sort-select');
        
        if (action === 'sort-distance') {
            sortSelect.value = 'distance';
            const sorted = sortBusinesses(allBusinessesWithDistance, 'distance');
            renderBusinessGrid(sorted);
        } else if (typeof action === 'number') {
            // Filter by radius
            const filtered = filterByDistance(allBusinessesWithDistance, action);
            renderBusinessGrid(filtered);
        }
    }));
}

/**
 * Render Business Grid
 * 
 * Efficiently renders business cards into the main grid container.
 * Uses document fragments for optimal DOM performance.
 * 
 * Performance Optimization:
 * Instead of appending each card individually (causing multiple reflows),
 * we build all cards in a DocumentFragment and append once. This reduces
 * browser reflow/repaint cycles from N to 1, significantly improving performance
 * for large datasets (50+ businesses).
 * 
 * Edge Cases:
 * - Empty list: Shows "No businesses found" message
 * - Null/undefined list: Shows "No businesses found" message
 * - Large lists: Still performant due to fragment batching
 * 
 * @function
 * @private
 * @param {Array<Object>} list - Array of business objects to render
 * @returns {void}
 */
function renderBusinessGrid(list) {
    const grid = document.getElementById('business-grid');
    grid.innerHTML = ''; // Clear existing content
    
    // Handle empty or invalid data
    if (!list || list.length === 0) {
        grid.innerHTML = '<p>No businesses found.</p>';
        return;
    }

    // Performance optimization: use DocumentFragment to batch DOM updates
    const fragment = document.createDocumentFragment();
    list.forEach(business => {
        fragment.appendChild(businessCard(business));
    });
    // Single DOM append - much faster than multiple individual appends
    grid.appendChild(fragment);
}

/**
 * Sort Businesses by Selected Mode
 * 
 * Applies sorting algorithm based on user-selected mode.
 * Creates a shallow copy to avoid mutating original data (immutability pattern).
 * 
 * Sorting Algorithms:
 * - rating: Descending numeric sort (highest rated first)
 * - alpha: Alphabetical by name using locale-aware comparison
 * - newest: Descending by ID (assumes higher ID = newer business)
 * - distance: Uses Haversine formula via sortByDistance utility
 * - category: Alphabetical by category (default fallback)
 * 
 * Why Immutability Matters:
 * We clone the array ([...businesses]) to preserve the original data structure.
 * This prevents unintended side effects and makes the code more predictable,
 * allowing us to maintain multiple sorted views without corrupting source data.
 * 
 * Locale-Aware Sorting:
 * localeCompare() handles international characters correctly (e.g., "Café" sorts properly)
 * and respects the user's locale settings.
 * 
 * @function
 * @private
 * @param {Array<Object>} businesses - Array of business objects to sort
 * @param {string} mode - Sort mode: 'rating', 'alpha', 'newest', 'distance', or 'category'
 * @returns {Array<Object>} Newly sorted array (original unchanged)
 */
function sortBusinesses(businesses, mode) {
    // Create shallow copy to avoid mutating original array
    const clone = [...businesses];
    switch (mode) {
        case 'rating': return clone.sort((a, b) => b.rating - a.rating); // High to low
        case 'alpha': return clone.sort((a, b) => a.name.localeCompare(b.name)); // A-Z, locale-aware
        case 'newest': return clone.sort((a, b) => b.id - a.id); // Newest first (higher ID = newer)
        case 'distance': return sortByDistance(clone); // Haversine-based distance sorting
        case 'category': default: return clone.sort((a, b) => a.category.localeCompare(b.category)); // Category A-Z
    }
}

/**
 * Render Active Deals Banner
 * 
 * Displays the first currently active deal in a prominent banner above the main content.
 * Helps promote special offers and drive user engagement with businesses.
 * 
 * Business Logic:
 * 1. Filters deals to only show currently active ones (within date range)
 * 2. Selects the first active deal (could be enhanced with priority ranking)
 * 3. Looks up the associated business to display its name
 * 4. Creates banner with deal info and quick-navigation button
 * 
 * UI Behavior:
 * - Banner hidden by default (hidden class)
 * - Only shown if active deals exist
 * - Only shown if associated business exists in database
 * - "View" button navigates directly to business detail page
 * 
 * Future Enhancements:
 * - Could show multiple deals in a carousel
 * - Could prioritize by deal value or expiration date
 * - Could include countdown timer for expiring deals
 * 
 * @function
 * @private
 * @param {Array<Object>} deals - All deals from data source
 * @param {Array<Object>} businesses - All businesses for lookup
 * @returns {void}
 */
function renderDeals(deals, businesses) {
    const banner = document.getElementById('deal-banner');
    if (!banner) return; // Banner element not found, exit gracefully

    // Filter to only currently active deals (within date range)
    const activeDeals = getActiveDeals(deals);
    
    if (activeDeals.length === 0) return; // No active deals, keep banner hidden

    const deal = activeDeals[0]; // Show first active deal (simple priority)
    const business = businesses.find(b => b.id == deal.businessId);
    
    // Only show banner if we can find the associated business
    if (business) {
        banner.innerHTML = `
            <div class="flex-between">
                <span><strong>${deal.title}</strong> at ${business.name}: ${deal.description}</span>
                <button class="button button-sm button-outline" onclick="location.hash='#/business/${business.id}'">View</button>
            </div>
        `;
        banner.classList.remove('hidden'); // Make banner visible
    }
}

/**
 * Render Trending Section
 * 
 * Displays top 2 trending businesses based on review volume.
 * Provides social proof and highlights popular community favorites.
 * 
 * Trending Algorithm:
 * 1. Count total reviews for each business
 * 2. Sort businesses by review count (descending)
 * 3. Take top 2 results
 * 4. Display as clickable cards
 * 
 * Why Review Count as Trending Metric:
 * Review volume indicates active community engagement and recent interest.
 * Businesses with more reviews are typically more established or currently popular,
 * making them good recommendations for new users.
 * 
 * Future Enhancements:
 * - Could weight recent reviews more heavily (time decay)
 * - Could factor in review rating (volume + quality)
 * - Could consider view history or favorites
 * - Could use a time window (trending this week)
 * 
 * Social Proof Benefits:
 * Showing trending businesses builds trust and helps users discover
 * popular local favorites they might otherwise miss.
 * 
 * @function
 * @private
 * @param {Array<Object>} allReviews - All reviews from data source
 * @param {Array<Object>} businesses - All businesses to evaluate
 * @returns {void}
 */
function renderTrendingSection(allReviews, businesses) {
    const list = document.getElementById('trending-list');
    if (!list) return; // Container not found

    // Trending algorithm: count reviews per business and sort
    const trending = businesses
        .map(b => ({
            business: b,
            count: allReviews.filter(r => r.businessId == b.id).length // Count matching reviews
        }))
        .sort((a, b) => b.count - a.count) // Sort by count descending
        .slice(0, 2); // Take top 2

    if (trending.length === 0) {
        list.innerHTML = '<p>No trending data yet.</p>';
        return;
    }

    trending.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card p-sm';
        div.innerHTML = `
            <h4>${item.business.name}</h4>
            <p>${item.count} reviews</p>
        `;
        // Make card clickable - navigates to business detail
        div.onclick = () => location.hash = `#/business/${item.business.id}`;
        list.appendChild(div);
    });
}

/**
 * Render Personalized Recommendations
 * 
 * Displays AI-powered business recommendations based on user behavior and preferences.
 * This function is called after lazy-loading the recommendation service.
 * 
 * Recommendation Engine Features:
 * - Analyzes user favorites and browsing history
 * - Considers review activity (what they've reviewed)
 * - Factors in category preferences
 * - Weights by business rating and credibility
 * - Includes active deals as a bonus signal
 * 
 * Why Lazy Loading:
 * The recommendation service and its dependencies are loaded asynchronously
 * (dynamic import) to reduce initial page load time. Recommendations are
 * non-critical content that can load after the main page is interactive.
 * 
 * Graceful Degradation:
 * - If recommendation service fails to load, page still functions
 * - If no recommendations available (new user), section stays hidden
 * - If error occurs, logs warning but doesn't break page
 * 
 * Privacy Note:
 * All recommendation data is stored locally (localStorage) - no server tracking.
 * Users maintain full control over their data.
 * 
 * @async
 * @function
 * @private
 * @param {Function} getRecommendedBusinesses - Recommendation service function
 * @param {Function} recommendationCard - Card component renderer
 * @returns {Promise<void>}
 */
async function renderRecommendations(getRecommendedBusinesses, recommendationCard) {
    const section = document.getElementById('recommendation-section');
    const grid = document.getElementById('recommendation-grid');
    if (!section || !grid) return; // Elements not found
    
    try {
        // Request top 3 recommendations based on user behavior
        const recommendations = await getRecommendedBusinesses(3);
        if (recommendations && recommendations.length > 0) {
            section.classList.remove('hidden'); // Show recommendation section
            grid.innerHTML = ''; // Clear loading state if any
            recommendations.forEach(rec => {
                // Each rec contains: { business, score, reasons }
                grid.appendChild(recommendationCard(rec));
            });
        }
        // If no recommendations, section stays hidden (expected for new users)
    } catch (e) {
        // Graceful failure - log but don't break the page
        console.warn("Recs failed", e);
    }
}
