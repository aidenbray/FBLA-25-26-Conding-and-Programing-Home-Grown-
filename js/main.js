/**
 * Main Application Entry Point
 * 
 * This module serves as the primary initialization point for the Byte-Sized Business Boost application.
 * It coordinates the startup sequence by initializing core application features in the proper order.
 * 
 * Initialization Sequence:
 * 1. Router - Sets up client-side routing for SPA navigation
 * 2. Chatbot - Initializes the AI-powered business recommendation chatbot
 * 3. Offline Detection - Enables offline/online status monitoring
 * 4. Service Worker - Registers PWA service worker for caching and offline support
 * 
 * @module main
 * @requires ./router.js - Client-side routing system
 * @requires ./components/chatbotWidget.js - Interactive chatbot component
 * @requires ./utils/offlineUtils.js - Network connectivity utilities
 */

import { initRouter } from './router.js';
import { initChatbot } from './components/chatbotWidget.js';
import { initOfflineDetection } from './utils/offlineUtils.js';

/**
 * Application Initialization
 * 
 * Waits for DOM to be fully loaded before initializing application features.
 * This ensures all DOM elements are available before JavaScript attempts to manipulate them.
 * 
 * Initialization Steps:
 * 1. Router initialization - Enables hash-based navigation (#/home, #/business/123, etc.)
 * 2. Chatbot initialization - Creates chatbot widget and sets up event handlers
 * 3. Offline detection - Monitors network status and displays notifications
 * 4. Service Worker registration - Enables PWA features (offline support, caching, installability)
 * 
 * @listens DOMContentLoaded - Fires when initial HTML document is completely loaded and parsed
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize client-side routing system
    // Handles URL hash changes and renders appropriate page components
    initRouter();
    
    // Initialize interactive chatbot widget
    // Provides AI-powered business recommendations to users
    initChatbot();
    
    // Initialize offline/online detection
    // Monitors network connectivity and displays appropriate UI feedback
    initOfflineDetection();

    /**
     * Service Worker Registration
     * 
     * Registers the service worker to enable Progressive Web App (PWA) features:
     * - Offline functionality through intelligent caching
     * - Faster load times via cached resources
     * - Background sync capabilities
     * - Push notification support (future enhancement)
     * - App installability on user devices
     * 
     * The service worker is only registered if the browser supports it.
     * Modern browsers (Chrome, Firefox, Safari, Edge) all support service workers.
     * 
     * Caching Strategy:
     * - Static assets: Cache-first (fast, works offline)
     * - Data files: Network-first (fresh data when online, fallback to cache when offline)
     * - Images: Cache-first with network fallback
     * 
     * @see /service-worker.js - Service worker implementation
     */
    if ("serviceWorker" in navigator) {
        // Attempt to register the service worker
        navigator.serviceWorker.register("/service-worker.js")
            .then(registration => {
                // Registration successful - log the scope
                // Scope determines which pages the service worker controls
                console.log("Service Worker registered with scope:", registration.scope);
            })
            .catch(error => {
                // Registration failed - log error but app still functions without PWA features
                console.error("Service Worker registration failed:", error);
            });
    }
});
