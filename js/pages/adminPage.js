/**
 * Admin Dashboard Page Module
 * 
 * Secure administrative interface for managing business data, deals, reviews, and system settings.
 * Implements client-side authentication with SHA-256 password hashing.
 * 
 * Key Features:
 * - Password-protected access (SHA-256 hashed)
 * - Tab-based interface for different management areas
 * - Full CRUD operations for businesses, deals, and reviews
 * - Real-time analytics dashboard with custom charts
 * - Data integrity checker
 * - Import/Export functionality for backup/migration
 * - Review moderation (hide/unhide, delete)
 * 
 * Security Model:
 * - Client-side authentication (suitable for demo/education)
 * - Password stored as SHA-256 hash
 * - Session stored in localStorage
 * - No sensitive data transmission
 * 
 * Data Management:
 * - LocalStorage-based CRUD with original data preservation
 * - Custom edits stored separately from base data
 * - Deleted items tracked by ID (soft delete pattern)
 * - Data integrity validation before operations
 * 
 * Admin Tabs:
 * 1. Businesses - Add, edit, delete business listings
 * 2. Deals - Manage promotional deals and date ranges
 * 3. Reviews - Moderate reviews (hide/unhide, delete)
 * 4. Analytics - View statistics and charts
 * 5. Settings - Import/Export, integrity checks
 * 
 * @module pages/adminPage
 * @requires services/adminAuthService - Authentication logic
 * @requires services/adminDataService - Data CRUD and validation
 * @requires components/adminBusinessEditor - Business management UI
 * @requires components/adminDealEditor - Deal management UI
 * @requires components/adminReviewManager - Review moderation UI
 * @requires components/analyticsCharts - Analytics visualization
 */

import { isAdmin, loginAdmin, logoutAdmin } from '../services/adminAuthService.js';
import { renderBusinessAdmin } from '../components/adminBusinessEditor.js';
import { renderDealAdmin } from '../components/adminDealEditor.js';
import { renderReviewAdmin } from '../components/adminReviewManager.js';
import { renderAnalytics } from '../components/analyticsCharts.js';
import { runIntegrityChecks, exportData, importData } from '../services/adminDataService.js';

/**
 * Render Admin Dashboard Page
 * 
 * Main entry point for admin interface. Checks authentication status
 * and renders either login form or dashboard based on session state.
 * 
 * Flow:
 * 1. Load admin CSS dynamically (only when needed)
 * 2. Check authentication status from localStorage
 * 3. Render login form if not authenticated
 * 4. Render full dashboard if authenticated
 * 
 * CSS Loading:
 * Admin CSS is loaded dynamically to avoid bloating the main bundle.
 * Only loads once (checked by ID) for performance.
 * 
 * @async\n * @function
 * @export
 * @returns {Promise<void>}
 */
export async function renderAdminPage() {
    const mainContent = document.getElementById('main-content');
    
    // Load Admin CSS
    if (!document.getElementById('admin-css')) {
        const link = document.createElement('link');
        link.id = 'admin-css';
        link.rel = 'stylesheet';
        link.href = 'css/admin.css';
        document.head.appendChild(link);
    }

    if (!isAdmin()) {
        renderLogin(mainContent);
    } else {
        renderDashboard(mainContent);
    }
}

/**
 * Render Admin Login Form
 * 
 * Displays password input form for admin authentication.
 * Uses SHA-256 hashing for password verification.
 * 
 * Security Notes:
 * - Password is hashed client-side before comparison
 * - Hash comparison happens in adminAuthService
 * - Default password: "admin" (SHA-256: 8c6976e5...)
 * - For production, would need server-side auth
 * 
 * User Experience:
 * - Simple single-field form
 * - Error message for invalid password
 * - Automatic redirect to dashboard on success
 * 
 * @function
 * @private
 * @param {HTMLElement} container - Main content container
 * @returns {void}
 */
function renderLogin(container) {
    container.innerHTML = `
        <div class="admin-container">
            <div class="admin-login-container">
                <h2>Admin Login</h2>
                <form class="admin-login-form" id="admin-login-form">
                    <input type="password" id="admin-password" placeholder="Enter Password" required>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
                <p id="login-error" class="error-message"></p>
            </div>
        </div>
    `;

    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        const success = await loginAdmin(password);
        if (success) {
            renderDashboard(container);
        } else {
            document.getElementById('login-error').textContent = "Invalid password";
        }
    });
}

/**
 * Render Admin Dashboard
 * 
 * Main admin interface with tabbed navigation for different management areas.
 * Provides access to all administrative functions.
 * 
 * Dashboard Structure:
 * - Header: Title and logout button
 * - Navigation: Tab buttons for each section
 * - Content Area: Dynamic content based on selected tab
 * 
 * Tab Management:
 * - Active tab highlighted with CSS class
 * - Content loaded dynamically when tab clicked
 * - Default tab: Businesses (most common admin task)
 * 
 * Event Handling:
 * - Logout button clears session and redirects
 * - Tab buttons use data attributes for routing
 * - Single event listener per tab type (delegation pattern)
 * 
 * @function
 * @private
 * @param {HTMLElement} container - Main content container
 * @returns {void}
 */
function renderDashboard(container) {
    container.innerHTML = `
        <div class="admin-container">
            <div class="admin-header">
                <h1>Admin Dashboard</h1>
                <button id="admin-logout" class="btn btn-secondary">Logout</button>
            </div>
            
            <div class="admin-nav">
                <button class="admin-tab-btn active" data-tab="businesses">Businesses</button>
                <button class="admin-tab-btn" data-tab="deals">Deals</button>
                <button class="admin-tab-btn" data-tab="reviews">Reviews</button>
                <button class="admin-tab-btn" data-tab="analytics">Analytics</button>
                <button class="admin-tab-btn" data-tab="settings">Settings & Import/Export</button>
            </div>

            <div id="admin-tab-content" class="admin-content">
                <!-- Content loaded here -->
            </div>
        </div>
    `;

    document.getElementById('admin-logout').addEventListener('click', logoutAdmin);

    const tabs = document.querySelectorAll('.admin-tab-btn');
    const contentDiv = document.getElementById('admin-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadTab(tab.dataset.tab, contentDiv);
        });
    });

    // Load default tab
    // Load default tab on initial render
    loadTab('businesses', contentDiv);
}

/**
 * Load Tab Content
 * 
 * Dynamically loads and renders content for the selected admin tab.
 * Each tab corresponds to a different management component.
 * 
 * Tab Routing:
 * - businesses: Business CRUD operations
 * - deals: Deal management with date validation
 * - reviews: Review moderation and filtering
 * - analytics: Statistics visualization
 * - settings: Import/Export and integrity checks
 * 
 * Loading Pattern:
 * Shows "Loading..." message while component initializes
 * (some components fetch data asynchronously)
 * 
 * Component Responsibilities:
 * Each tab component is responsible for:
 * - Rendering its own UI
 * - Managing its own event handlers
 * - Calling appropriate service functions
 * - Handling errors and validation
 * 
 * @async
 * @function
 * @private
 * @param {string} tabName - Name of tab to load
 * @param {HTMLElement} container - Content container element
 * @returns {Promise<void>}
 */
async function loadTab(tabName, container) {
    container.innerHTML = '<p>Loading...</p>';
    
    switch(tabName) {
        case 'businesses':
            await renderBusinessAdmin(container);
            break;
        case 'deals':
            await renderDealAdmin(container);
            break;
        case 'reviews':
            await renderReviewAdmin(container);
            break;
        case 'analytics':
            await renderAnalytics(container);
            break;
        case 'settings':
            await renderSettings(container);
            break;
    }
}

/**
 * Render Settings and Data Management Tab
 * 
 * Provides tools for data backup, migration, and system integrity validation.
 * Essential for maintaining data quality and enabling disaster recovery.
 * 
 * Features:
 * 1. Export Data - Download JSON files for businesses, deals, or reviews
 * 2. Import Data - Restore from JSON backup files
 * 3. Integrity Checker - Validate data consistency and relationships
 * 
 * Export Functionality:
 * - Creates downloadable JSON files
 * - Includes custom edits and original data
 * - Separate export for each data type
 * - Uses Blob API for file generation
 * 
 * Import Functionality:
 * - Validates JSON structure before import
 * - Checks schema against expected format
 * - Overwrites existing custom data
 * - Shows success/error feedback
 * 
 * Integrity Checks:
 * - Duplicate ID detection
 * - Missing required fields validation
 * - Date range validation (deals)
 * - Relationship consistency (foreign keys)
 * - Reports all issues found
 * 
 * Use Cases:
 * - Backup before major changes
 * - Migrate data between environments
 * - Restore from corruption
 * - Audit data quality
 * 
 * @async
 * @function
 * @private
 * @param {HTMLElement} container - Content container element
 * @returns {Promise<void>}
 */
async function renderSettings(container) {
    container.innerHTML = `
        <div class="admin-section">
            <h2>Data Management</h2>
            
            <div class="admin-form-group">
                <h3>Export Data</h3>
                <div class="admin-actions">
                    <button id="export-biz" class="btn btn-primary">Export Businesses</button>
                    <button id="export-deals" class="btn btn-primary">Export Deals</button>
                    <button id="export-reviews" class="btn btn-primary">Export Reviews</button>
                </div>
            </div>

            <div class="admin-form-group">
                <h3>Import Data</h3>
                <input type="file" id="import-file" accept=".json">
                <select id="import-type">
                    <option value="businesses">Businesses</option>
                    <option value="deals">Deals</option>
                    <option value="reviews">Reviews</option>
                </select>
                <button id="import-btn" class="btn btn-secondary">Import</button>
                <p id="import-status"></p>
            </div>

            <div class="admin-form-group">
                <h3>System Integrity</h3>
                <button id="check-integrity" class="btn btn-secondary">Run Integrity Checks</button>
                <div id="integrity-results" class="integrity-results"></div>
            </div>
        </div>
    `;

    // Export Handlers
    const setupExport = (id, type) => {
        container.querySelector(id).addEventListener('click', async () => {
            const url = await exportData(type);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_export.json`;
            a.click();
        });
    };
    setupExport('#export-biz', 'businesses');
    setupExport('#export-deals', 'deals');
    setupExport('#export-reviews', 'reviews');

    // Import Handler
    container.querySelector('#import-btn').addEventListener('click', () => {
        const fileInput = container.querySelector('#import-file');
        const type = container.querySelector('#import-type').value;
        const status = container.querySelector('#import-status');

        if (fileInput.files.length === 0) {
            status.textContent = "Please select a file.";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = importData(e.target.result, type);
            if (result.success) {
                status.textContent = "Import successful!";
                status.style.color = "green";
            } else {
                status.textContent = "Error: " + result.error;
                status.style.color = "red";
            }
        };
        reader.readAsText(fileInput.files[0]);
    });

    // Integrity Check Handler
    container.querySelector('#check-integrity').addEventListener('click', async () => {
        const resultsDiv = container.querySelector('#integrity-results');
        resultsDiv.innerHTML = 'Running checks...';
        
        // Run comprehensive integrity validation
        const issues = await runIntegrityChecks();
        
        if (issues.length === 0) {
            // All checks passed - display success message
            resultsDiv.innerHTML = '<div class="integrity-ok">✓ No issues found.</div>';
        } else {
            // Issues found - display detailed error list
            resultsDiv.innerHTML = `
                <div style="color: #dc3545; font-weight: bold; margin-bottom: 0.5rem;">⚠ ${issues.length} issues detected:</div>
                ${issues.map(i => `<div class="integrity-issue">- ${i}</div>`).join('')}
            `;
        }
    });
}
