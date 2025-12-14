export const DEMO_STEPS = [
    {
        title: "Welcome & Overview",
        description: "Introduction to Byte-Sized Business Boost. Showcasing the clean, responsive landing page.",
        path: "/",
        action: (frame) => {
            // Scroll to top
            frame.contentWindow.scrollTo(0, 0);
        }
    },
    {
        title: "Business Sorting",
        description: "Demonstrate dynamic sorting capabilities (Category, Rating, A-Z).",
        path: "/",
        action: (frame) => {
            const select = frame.contentDocument.getElementById('sort-select');
            if (select) {
                highlightElement(frame, '#sort-select');
                // Simulate change? Maybe just highlight.
            }
        }
    },
    {
        title: "Business Page Deep Dive",
        description: "Detailed view of a business with reviews, map placeholder, and info.",
        path: "/business/1", // Assuming ID 1 exists (SwiftFit Gym)
        action: (frame) => {
            highlightElement(frame, '.business-detail-card');
        }
    },
    {
        title: "Reviews & Validation",
        description: "Showcase the review system, credibility scoring, and validation logic.",
        path: "/business/1",
        action: (frame) => {
            // Scroll to reviews
            const reviews = frame.contentDocument.querySelector('.reviews-section');
            if (reviews) {
                reviews.scrollIntoView({ behavior: 'smooth' });
                highlightElement(frame, '.reviews-section');
            }
        }
    },
    {
        title: "Favorites System",
        description: "Add a business to favorites and view it in the favorites list (if implemented in UI).",
        path: "/",
        action: (frame) => {
            // Highlight a favorite button
            highlightElement(frame, '.btn-favorite');
        }
    },
    {
        title: "Deals & Coupons",
        description: "Highlight active deals and discounts available for businesses.",
        path: "/",
        action: (frame) => {
            // Highlight deal banner or specific deal
            highlightElement(frame, '#deal-banner');
        }
    },
    {
        title: "Recommendation Engine",
        description: "Show personalized recommendations based on user activity.",
        path: "/",
        action: (frame) => {
            const recSection = frame.contentDocument.getElementById('recommendation-section');
            if (recSection) {
                recSection.style.display = 'block'; // Force show if hidden
                recSection.scrollIntoView({ behavior: 'smooth' });
                highlightElement(frame, '#recommendation-section');
            }
        }
    },
    {
        title: "Chatbot Feature",
        description: "Interact with the AI assistant for help and discovery.",
        path: "/",
        action: (frame) => {
            const chatBtn = frame.contentDocument.getElementById('chatbot-toggle');
            if (chatBtn) {
                chatBtn.click(); // Open chat
                highlightElement(frame, '#chatbot-window');
            }
        }
    },
    {
        title: "Admin Panel",
        description: "Secure, client-side admin management for businesses and data.",
        path: "/admin",
        action: (frame) => {
            // Maybe auto-fill login?
            const passInput = frame.contentDocument.getElementById('admin-password');
            if (passInput) {
                passInput.value = 'admin';
                highlightElement(frame, '.admin-login-form');
            }
        }
    },
    {
        title: "Offline Mode",
        description: "Demonstrate PWA capabilities and offline data access.",
        path: "/",
        action: (frame) => {
            // Trigger offline banner via utility if possible, or just explain
            // We can try to call the utility in the frame
            if (frame.contentWindow.showOfflineBanner) {
                frame.contentWindow.showOfflineBanner();
            }
        }
    },
    {
        title: "Presentation Summary",
        description: "Recap of features and final thank you.",
        path: "/", // Or a specific summary page if we had one
        action: (frame) => {
            alert("Presentation Complete! Thank you.");
        }
    }
];

function highlightElement(frame, selector) {
    const doc = frame.contentDocument;
    const el = doc.querySelector(selector);
    if (el) {
        el.classList.add('highlight');
        setTimeout(() => {
            el.classList.remove('highlight');
        }, 5000);
    }
}
