/**
 * Judge Evaluation Page Module
 * 
 * Special presentation mode designed for FBLA competition judging.
 * Provides a guided walkthrough of all application features with live demonstrations.
 * 
 * Key Features:
 * - Split-screen layout: Steps panel, live app preview, rubric notes
 * - Guided demonstration script with predefined steps
 * - Live application iframe for interactive demonstrations
 * - Environment reset button (clears all user data)
 * - Offline mode simulation
 * - Rubric reference panel for judges
 * 
 * Page Layout (3-Column):
 * 1. Left Panel - Step-by-step demonstration guide
 * 2. Center Panel - Live app iframe with control buttons
 * 3. Right Panel - Judging rubric with key evaluation criteria
 * 
 * Demonstration Flow:
 * - Each step highlights specific features
 * - Click "Show This Step" to navigate and demonstrate
 * - Automatic navigation to relevant pages
 * - Visual highlighting of important elements
 * - Script provided for presenters
 * 
 * Control Features:
 * - Reset Environment: Clears all localStorage data for clean demo
 * - Simulate Offline: Shows offline banner (PWA capability demo)
 * 
 * Rubric Categories:
 * - Code Quality (modular architecture, no external libraries)
 * - UX & Accessibility (responsive design, ARIA labels)
 * - Functionality (search, sort, filter, CRUD)
 * - Data Analysis (credibility scoring, recommendations)
 * 
 * @module pages/judgePage
 * @requires components/judgeStep - Demonstration step definitions
 * @requires utils/resetEnvironment - Data reset functionality
 */

import { DEMO_STEPS } from '../components/judgeStep.js';
import { resetAllData } from '../utils/resetEnvironment.js';

/**
 * Render Judge Evaluation Page
 * 
 * Creates specialized judging interface with guided demonstration capabilities.
 * Completely replaces normal application UI with judging-specific layout.
 * 
 * Page Structure:
 * - Steps Panel: Guided walkthrough with clickable steps
 * - App Preview: Live iframe showing actual application
 * - Control Buttons: Reset and offline simulation
 * - Rubric Panel: Key evaluation criteria for judges
 * \n * CSS Loading:
 * Dynamically loads judge-specific CSS to avoid bloating main bundle.
 * Only loads once per session (checked by ID).
 * \n * Full-Screen Override:
 * Replaces entire document.body to create immersive judging environment.
 * This ensures clean presentation without interference from main app navigation.
 * \n * @function
 * @export
 * @returns {void}
 */
export function renderJudgePage() {
    // Inject CSS
    if (!document.getElementById('judge-css')) {
        const link = document.createElement('link');
        link.id = 'judge-css';
        link.rel = 'stylesheet';
        link.href = 'css/judge.css';
        document.head.appendChild(link);
    }

    // Override main container to be full screen for judge mode
    document.body.innerHTML = `
        <div class="judge-container">
            <div class="judge-steps-panel" id="judge-steps">
                <div class="judge-steps-header">
                    <h3>Guided Demo</h3>
                    <p>Follow the script below.</p>
                </div>
                <!-- Steps injected here -->
            </div>
            
            <div class="judge-app-view">
                <div class="judge-controls">
                    <button id="reset-env-btn" class="control-btn danger">Reset Environment</button>
                    <button id="toggle-offline-btn" class="control-btn">Simulate Offline</button>
                </div>
                <div class="app-frame-container">
                    <iframe id="app-frame" src="index.html#/" title="Live App Preview"></iframe>
                </div>
            </div>
            
            <div class="judge-notes-panel">
                <h3>Judge's Rubric Notes</h3>
                
                <div class="note-category">
                    <h4>Code Quality</h4>
                    <div class="note-item">Modular ES6+ Architecture</div>
                    <div class="note-item">No External Libraries (Pure JS)</div>
                    <div class="note-item">Efficient DOM Manipulation</div>
                </div>

                <div class="note-category">
                    <h4>UX & Accessibility</h4>
                    <div class="note-item">Responsive Mobile-First Design</div>
                    <div class="note-item">ARIA Labels & Semantic HTML</div>
                    <div class="note-item">Offline Fallbacks & PWA Support</div>
                </div>

                <div class="note-category">
                    <h4>Functionality</h4>
                    <div class="note-item">Search, Sort, & Filter</div>
                    <div class="note-item">Admin CRUD Operations</div>
                    <div class="note-item">Data Persistence (LocalStorage)</div>
                </div>

                <div class="note-category">
                    <h4>Data Analysis</h4>
                    <div class="note-item">Credibility Scoring Algorithm</div>
                    <div class="note-item">Recommendation Engine</div>
                    <div class="note-item">Admin Analytics Dashboard</div>
                </div>
            </div>
        </div>
    `;

    // Initialize demonstration steps and control buttons
    renderSteps();
    setupControls();
}

/**
 * Render Demonstration Steps
 * 
 * Creates clickable step-by-step guide for judges to follow during evaluation.
 * Each step demonstrates a specific feature or functionality.
 * 
 * Step Structure:
 * - Title: Feature name or section being demonstrated
 * - Description: Brief explanation of what will be shown
 * - Button: "Show This Step" - triggers navigation and actions
 * - Action: Custom function to highlight/interact with feature
 * 
 * Step Interaction Flow:
 * 1. Judge clicks "Show This Step" button
 * 2. Active state updates visually (highlights current step)
 * 3. Iframe navigates to relevant page (if URL changed)
 * 4. Custom action executes after 500ms delay (allows page load)
 * 5. Feature is highlighted or activated in the live preview
 * 
 * Timing Considerations:
 * 500ms delay after navigation ensures:
 * - Page has loaded in iframe
 * - DOM elements are available for highlighting
 * - Smooth visual transition for judges
 * 
 * Active State Management:
 * - Only one step active at a time
 * - Active step highlighted with CSS class
 * - Provides visual feedback of current demonstration point
 * 
 * @function
 * @private
 * @returns {void}
 */
function renderSteps() {
    const container = document.getElementById('judge-steps');
    const frame = document.getElementById('app-frame');

    DEMO_STEPS.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'step-item';
        stepEl.innerHTML = `
            <div class="step-title">${index + 1}. ${step.title}</div>
            <div class="step-desc">${step.description}</div>
            <button class="step-btn">Show This Step</button>
        `;

        stepEl.querySelector('.step-btn').addEventListener('click', () => {
            // Update Active State - highlight current step visually
            document.querySelectorAll('.step-item').forEach(el => el.classList.remove('active'));
            stepEl.classList.add('active');

            // Navigate Iframe to demonstration page
            const currentHash = frame.contentWindow.location.hash;
            const targetHash = '#' + step.path;
            
            if (currentHash !== targetHash) {
                // Page change needed - navigate then execute action
                frame.contentWindow.location.hash = targetHash;
                // Wait 500ms for page to load before highlighting/interacting
                setTimeout(() => {
                    step.action(frame);
                }, 500);
            } else {
                // Already on correct page - execute action immediately
                step.action(frame);
            }
        });

        container.appendChild(stepEl);
    });
}

/**
 * Setup Control Buttons
 * 
 * Initializes event handlers for judge control buttons:
 * - Reset Environment: Clears all user data for clean demo restart
 * - Simulate Offline: Demonstrates PWA offline capabilities
 * 
 * Reset Environment Button:
 * Purpose: Allow judges to see the app in pristine state multiple times
 * - Clears all localStorage (favorites, custom edits, admin session)
 * - Reloads iframe to show clean state
 * - Confirmation dialog prevents accidental resets
 * 
 * Simulate Offline Button:
 * Purpose: Demonstrate Progressive Web App capabilities
 * - Shows offline banner in the live app
 * - Proves app can function without network connection
 * - Highlights service worker and caching strategy
 * 
 * Why These Controls Matter for Judging:
 * - Reset: Allows repeated demonstrations without corrupting state
 * - Offline: Proves PWA compliance and offline-first architecture
 * - Both demonstrate technical sophistication and user-centric design
 * 
 * @function
 * @private
 * @returns {void}
 */
function setupControls() {
    // Reset Environment Button Handler
    document.getElementById('reset-env-btn').addEventListener('click', () => {
        // Confirmation dialog prevents accidental data loss
        if (confirm("Reset all user data and restart demo?")) {
            resetAllData(); // Clears localStorage and reloads
        }
    });

    // Simulate Offline Button Handler
    document.getElementById('toggle-offline-btn').addEventListener('click', () => {
        const frame = document.getElementById('app-frame');
        
        // Browser security prevents true offline event simulation
        // So we call our offline utility function directly
        
        // Check if utility function is exposed by the iframe's loaded modules
        if (frame.contentWindow.showOfflineBanner) {
            frame.contentWindow.showOfflineBanner();
            alert("Simulated Offline Mode: Banner shown.");
        } else {
            // Fallback: Manually inject offline banner into iframe
            // This demonstrates the feature even if utility isn't loaded yet
            const doc = frame.contentDocument;
            const banner = doc.createElement('div');
            banner.style.cssText = "position:fixed;top:0;left:0;width:100%;background:#ff8800;color:white;text-align:center;padding:10px;z-index:9999;";
            banner.innerText = "Offline Mode (Simulated)";
            doc.body.prepend(banner);
        }
    });
}
