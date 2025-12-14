/**
 * Service Worker for Byte-Sized Business Boost PWA
 * 
 * Implements Progressive Web App (PWA) functionality through intelligent caching strategies.
 * Enables offline access, faster load times, and improved performance.
 * 
 * Core Responsibilities:
 * 1. Cache Management - Stores and retrieves resources from browser cache
 * 2. Offline Support - Serves cached content when network is unavailable
 * 3. Update Handling - Manages cache versioning and cleanup
 * 4. Performance Optimization - Reduces server requests through smart caching
 * 
 * Caching Strategies Implemented:
 * - Cache First: For static assets (HTML, CSS, JS, images) - Fast, works offline
 * - Network First: For data (JSON) - Fresh when online, cached fallback when offline
 * - Stale While Revalidate: For general resources - Instant response, updates in background
 * 
 * Cache Versioning:
 * - Timestamp-based versioning ensures clean updates
 * - Old caches are automatically deleted during activation
 * - Separate caches for static assets and dynamic data
 * 
 * @file service-worker.js
 * @version 9.0
 */

/**
 * Static Cache Name
 * 
 * Used for storing application shell resources (HTML, CSS, JS, images).
 * Versioned with timestamp to force cache refresh when service worker updates.
 * When version changes, old cache is automatically cleaned up.
 * 
 * @constant {string}
 */
const STATIC_CACHE = "bsbb-static-v9-" + new Date().getTime(); // Versioned hash

/**
 * Data Cache Name
 * 
 * Separate cache for dynamic data (businesses, deals, reviews).
 * Allows different caching strategies for data vs static assets.
 * Updated more frequently than static cache.
 * 
 * @constant {string}
 */
const DATA_CACHE = "bsbb-data-v9-" + new Date().getTime();

/**
 * Precache URL List - Static Assets
 * 
 * Critical resources to cache during service worker installation.
 * These files are essential for offline functionality:
 * - Core HTML files (index, offline page)
 * - Bundled/minified CSS and JavaScript
 * - Application icons and logos
 * - Business-specific images
 * 
 * Precaching Strategy:
 * - Downloaded and cached immediately when service worker installs
 * - Available instantly for offline use
 * - Must succeed for installation to complete (except data URLs)
 * 
 * Performance Consideration:
 * - Larger precache list = longer initial installation time
 * - Only includes truly essential resources
 * - Images are SVG format for small file sizes
 * 
 * @constant {string[]}
 */
const PRECACHE_URLS = [
    "/",                              // Root path
    "/index.html",                    // Main HTML file
    "/offline.html",                  // Offline fallback page
    "/manifest.json",                 // PWA manifest
    "/build/styles.min.css",          // Minified styles bundle
    "/build/bundle.min.js",           // Minified JavaScript bundle
    "/assets/swiftfit-gym.svg",       // SwiftFit Gym logo
    "/assets/review-photo-1.svg",     // Review photo 1
    "/assets/logo.svg",               // Application logo
    "/assets/pageturner-books.svg",   // PageTurner Books logo
    "/assets/evergreen-cafe.svg",     // Evergreen Café logo
    "/assets/review-photo-2.svg",     // Review photo 2
    "/assets/review-placeholder.svg", // Review placeholder image
    "/assets/review-photo-3.svg",     // Review photo 3
    "/assets/icons/icon.svg"          // PWA icon
];

/**
 * Data URL List - Dynamic Content
 * 
 * JSON data files to attempt caching during installation.
 * These contain business listings, deals, and reviews.
 * 
 * Special Handling:
 * - Failed precaching doesn't prevent service worker installation
 * - Uses network-first strategy during runtime
 * - Critical for offline functionality but may not exist during first install
 * 
 * Data Structure:
 * - businesses.json: Business listings with details
 * - deals.json: Current deals and promotions
 * - reviews.json: User-submitted reviews and ratings
 * 
 * @constant {string[]}
 */
const DATA_URLS = [
    "/data/businesses.json",  // Business listings database
    "/data/deals.json",       // Deals and promotions
    "/data/reviews.json"      // User reviews
];

/**
 * Service Worker Install Event Handler
 * 
 * Triggered when service worker is first installed or when a new version is detected.
 * Primary responsibility is to download and cache essential resources for offline use.
 * 
 * Install Phase Steps:
 * 1. Open/create the static cache
 * 2. Download and cache all PRECACHE_URLS (critical assets)
 * 3. Attempt to cache DATA_URLS (non-critical, allowed to fail)
 * 4. Skip waiting to activate immediately
 * 
 * Cache Strategy During Install:
 * - Static assets MUST succeed or installation fails
 * - Data files are optional (graceful degradation)
 * - Parallel download for faster installation
 * 
 * skipWaiting() Behavior:
 * - Immediately activates new service worker
 * - Replaces old service worker without waiting for tabs to close
 * - Ensures users get updates quickly
 * - May cause version conflicts if not handled carefully
 * 
 * Error Handling:
 * - Static asset failures: Installation fails, old SW remains active
 * - Data file failures: Logged as warning, installation continues
 * 
 * @listens install - Fired when service worker installs
 * @param {ExtendableEvent} event - Install event object
 */
self.addEventListener("install", event => {
    // Extend event lifetime until caching completes
    event.waitUntil(
        // Open the static cache (creates if doesn't exist)
        caches.open(STATIC_CACHE).then(async cache => {
            console.log("Pre-caching bundled files");
            
            // Cache all critical static assets
            // If any fail, entire installation fails (ensures app shell integrity)
            await cache.addAll(PRECACHE_URLS);
            
            /**
             * Attempt to cache data files with graceful failure
             * 
             * Data files may not exist on first deployment or during development.
             * We attempt to cache them but allow installation to succeed even if they fail.
             * This prevents service worker installation from blocking due to missing data.
             * 
             * Benefits:
             * - Service worker installs successfully even without data
             * - Data will be cached on first network request
             * - Offline functionality available for static content immediately
             */
            await Promise.all(DATA_URLS.map(url => {
                return cache.add(url).catch(err => {
                    // Log warning but don't throw - allows installation to continue
                    console.warn(`Failed to precache ${url}:`, err);
                });
            }));
        })
    );
    
    /**
     * Skip Waiting Phase
     * 
     * Immediately activate the new service worker without waiting for:
     * - All tabs/windows to close
     * - User to manually refresh
     * 
     * This ensures:
     * - Fast updates for users
     * - No stale service worker lingering
     * 
     * Trade-off:
     * - Users get updates immediately (good)
     * - May cause cache inconsistencies if multiple versions active (rare)
     */
    self.skipWaiting();
});

/**
 * Service Worker Activate Event Handler
 * 
 * Triggered after successful installation when the service worker takes control.
 * Primary responsibilities:
 * 1. Clean up old/outdated caches
 * 2. Take control of all pages immediately
 * 
 * Activation Phase Steps:
 * 1. Get list of all existing cache names
 * 2. Delete any caches that don't match current version
 * 3. Claim all clients (pages) immediately
 * 
 * Cache Cleanup Logic:
 * - Keeps current STATIC_CACHE and DATA_CACHE
 * - Deletes all other caches (old versions)
 * - Prevents unlimited cache growth
 * - Ensures users don't get stale content
 * 
 * Client Claiming:
 * - Takes control of all pages immediately
 * - No need to refresh page to use new service worker
 * - Works in conjunction with skipWaiting()
 * 
 * Why This Matters:
 * - Users get latest version without manual refresh
 * - Prevents cache bloat (disk space management)
 * - Ensures cache consistency across app
 * 
 * @listens activate - Fired when service worker activates
 * @param {ExtendableEvent} event - Activate event object
 */
self.addEventListener("activate", event => {
    // Extend event lifetime until cleanup completes
    event.waitUntil(
        // Get all cache names in browser
        caches.keys().then(keyList => {
            // Delete old caches in parallel for faster activation
            return Promise.all(
                keyList.map(key => {
                    /**
                     * Cache Version Check
                     * 
                     * Only keep caches that match current version names.
                     * Delete everything else to prevent:
                     * - Outdated content being served
                     * - Excessive disk space usage
                     * - Cache key collisions
                     * 
                     * Example Scenario:
                     * - Old: "bsbb-static-v8-1234567890"
                     * - Current: "bsbb-static-v9-9876543210"
                     * - Result: v8 cache is deleted
                     */
                    if (key !== STATIC_CACHE && key !== DATA_CACHE) {
                        console.log("Removing old cache", key);
                        return caches.delete(key);
                    }
                    // If cache matches current version, keep it (return undefined)
                })
            );
        })
    );
    
    /**
     * Claim All Clients
     * 
     * Immediately takes control of all pages currently controlled by this service worker.
     * Without this, pages would continue using the old service worker until next navigation.
     * 
     * Effect:
     * - All open tabs start using new service worker immediately
     * - No page refresh needed for updated caching behavior
     * - Essential for immediate bug fixes and updates
     * 
     * Use Case:
     * - User has site open when update deploys
     * - New service worker installs and activates
     * - claim() makes it active without closing/refreshing tabs
     */
    self.clients.claim();
});

/**
 * Service Worker Fetch Event Handler
 * 
 * Intercepts all network requests from the application and applies intelligent caching strategies.
 * Different resource types use different strategies optimized for their usage patterns.
 * 
 * Caching Strategies Implemented:
 * 
 * 1. Cache First (Images/Assets):
 *    - Check cache first, use network as fallback
 *    - Best for: Static images, logos, icons
 *    - Benefits: Instant loading, works offline, reduces bandwidth
 * 
 * 2. Network First (Data/JSON):
 *    - Try network first, use cache as fallback
 *    - Best for: Business data, deals, reviews
 *    - Benefits: Always fresh when online, works offline
 * 
 * 3. Stale While Revalidate (General):
 *    - Serve cached version immediately, update cache in background
 *    - Best for: HTML, CSS, JS that changes occasionally
 *    - Benefits: Fast response, stays updated automatically
 * 
 * Request Flow:
 * 1. Intercept fetch request
 * 2. Determine resource type (image, data, static)
 * 3. Apply appropriate caching strategy
 * 4. Return response or fallback
 * 
 * Offline Handling:
 * - Navigation requests → Show offline.html page
 * - Other requests → Return 404 or cached version
 * 
 * @listens fetch - Fired for every network request
 * @param {FetchEvent} event - Fetch event containing request information
 */
self.addEventListener("fetch", event => {
    // Parse request URL for routing decision
    const url = new URL(event.request.url);

    /**
     * Strategy 1: Cache First for Images and Assets
     * 
     * Images rarely change and are expensive to download.
     * Prioritize cache for instant loading and offline availability.
     * 
     * Flow:
     * 1. Check if cached version exists
     * 2. If found, return cached version immediately
     * 3. If not found, fetch from network
     * 4. Future enhancement: Cache the fetched image for next time
     * 
     * Use Cases:
     * - Business logos (/assets/swiftfit-gym.svg)
     * - Review photos (/assets/review-photo-1.svg)
     * - App icons (/assets/icons/icon.svg)
     * 
     * Benefits:
     * - Instant image loading (no network delay)
     * - Reduced bandwidth usage
     * - Works perfectly offline
     * - Improves perceived performance
     */
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            // Search cache for this image
            caches.match(event.request).then(cachedResponse => {
                // Return cached version or fetch from network as fallback
                return cachedResponse || fetch(event.request);
            })
        );
        return; // Exit early, don't apply other strategies
    }

    /**
     * Strategy 2: Network First for JSON Data Files
     * 
     * Business data, deals, and reviews need to be as fresh as possible.
     * Always try network first, use cache only when offline.
     * 
     * Flow:
     * 1. Attempt to fetch from network
     * 2. If successful (status 200), cache the response for offline use
     * 3. If network fails (offline), serve cached version
     * 4. If no cached version exists, return empty array
     * 
     * Data Files Handled:
     * - /data/businesses.json - Business listings
     * - /data/deals.json - Current deals and promotions
     * - /data/reviews.json - User reviews and ratings
     * 
     * Update Cache Logic:
     * - Only cache successful responses (200 status)
     * - Only cache HTTP/HTTPS requests (not chrome-extension://, etc.)
     * - Clone response before caching (response can only be read once)
     * 
     * Offline Fallback:
     * - Serve cached data if available
     * - Return empty array [] if nothing cached (prevents errors)
     * - Proper JSON content-type header for parsing
     * 
     * Benefits:
     * - Users see latest data when online
     * - App still functions with cached data when offline
     * - Graceful degradation (empty array if no cache)
     */
    if (url.pathname.includes("/data/") && url.pathname.endsWith(".json")) {
        event.respondWith(
            // Open data cache for read/write operations
            caches.open(DATA_CACHE).then(cache => {
                // Attempt network request first
                return fetch(event.request)
                    .then(response => {
                        /**
                         * Cache Update Logic
                         * 
                         * Only cache successful HTTP/HTTPS responses.
                         * Prevents caching error pages or invalid responses.
                         */
                        if (response.status === 200 && event.request.url.startsWith('http')) {
                            // Clone response (can only be read once)
                            cache.put(event.request.url, response.clone());
                        }
                        // Return original response to application
                        return response;
                    })
                    .catch(() => {
                        /**
                         * Network Failure Fallback
                         * 
                         * User is offline or server is down.
                         * Attempt to serve cached version.
                         */
                        return cache.match(event.request.url).then(response => {
                            // Return cached data or empty array if nothing cached
                            return response || new Response('[]', { 
                                status: 200, 
                                headers: { 'Content-Type': 'application/json' } 
                            });
                        });
                    });
            })
        );
        return; // Exit early, don't apply other strategies
    }

    /**
     * Strategy 3: Stale-While-Revalidate for General Static Resources
     * 
     * Default strategy for HTML, CSS, JS, and other resources.
     * Serves cached version immediately while updating cache in background.
     * 
     * Flow:
     * 1. Check if resource exists in cache
     * 2. Initiate network request in background
     * 3. If cached, return immediately (fast!)
     * 4. When network request completes, update cache for next time
     * 5. If not cached, wait for and return network response
     * 
     * Background Update Logic:
     * - Network request happens regardless of cache hit
     * - Cache is updated silently in background
     * - User doesn't wait for update (instant response)
     * - Next request gets updated version
     * 
     * Cache Criteria:
     * - Status 200 (success)
     * - Type 'basic' (same-origin response)
     * - HTTP/HTTPS protocol
     * 
     * Benefits:
     * - Instant response from cache
     * - Automatic background updates
     * - No stale content after first refresh
     * - Best of both worlds (speed + freshness)
     * 
     * Offline Fallback:
     * - Navigation requests → offline.html page
     * - Other requests → 404 response
     */
    event.respondWith(
        // Check cache for existing version
        caches.match(event.request).then(cachedResponse => {
            /**
             * Background Network Request
             * 
             * Fetch from network to update cache.
             * Happens in background, doesn't block cached response.
             */
            const fetchPromise = fetch(event.request).then(networkResponse => {
                /**
                 * Validate Response Before Caching
                 * 
                 * Only cache successful, same-origin HTTP responses.
                 * Prevents caching:
                 * - Error pages (404, 500)
                 * - CORS responses (type 'cors')
                 * - Non-HTTP protocols (chrome://, file://)
                 */
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    // Clone for caching (responses are single-use)
                    const responseToCache = networkResponse.clone();
                    // Only cache HTTP/HTTPS URLs
                    if (event.request.url.startsWith('http')) {
                        // Update cache in background
                        caches.open(STATIC_CACHE).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                }
                return networkResponse;
            });

            /**
             * Response Priority Decision
             * 
             * If cached version exists:
             * - Return it immediately (fast!)
             * - Let background fetch continue (updates cache silently)
             * 
             * If no cached version:
             * - Wait for network response
             * - User sees loading state
             * - Response gets cached for next time
             */
            if (cachedResponse) {
                // Ignore background fetch errors (user already has cached version)
                fetchPromise.catch(err => console.warn("Background fetch failed:", err));
                // Return cached version immediately
                return cachedResponse;
            }
            
            // No cached version, must wait for network
            return fetchPromise;
        }).catch(() => {
            /**
             * Complete Failure Fallback
             * 
             * Both cache and network failed.
             * Provide appropriate fallback based on request type.
             * 
             * Navigation Requests (page loads):
             * - Show offline.html page
             * - User-friendly offline experience
             * 
             * Non-Navigation Requests (API calls, etc.):
             * - Return 404 Not Found
             * - Prevents broken functionality
             */
            if (event.request.mode === 'navigate') {
                // User tried to navigate to a page - show offline page
                return caches.match('/offline.html');
            }
            // Other resource types - return 404
            return new Response('Not Found', { status: 404 });
        })
    );
});
