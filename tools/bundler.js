
// A simple bundler that concatenates files. 
// Since we are using ES modules in the source, a true bundler without AST parsing is hard.
// However, the prompt asks for "String concatenation for bundling" and "Ensure module import paths are rewritten or removed".
// Given the constraints (no external deps, simple JS), we will create a "bundle" that is essentially
// a concatenation of the files in a specific order, wrapped in an IIFE, 
// and we will strip out the `import` and `export` statements.
// This requires a manual ordering or a simple dependency graph.
// For this project, we can define the order manually or try to parse.

// Manual order based on dependency tree:
// 1. Utils
// 2. Services (independent ones first)
// 3. Components
// 4. Pages
// 5. Router
// 6. Main

const FILE_ORDER = [
    '/js/utils/stringUtils.js',
    '/js/utils/validation.js',
    '/js/utils/dateUtils.js',
    '/js/utils/captcha.js',
    '/js/utils/offlineUtils.js',
    '/js/services/knowledgeBase.js',
    '/js/services/businessService.js',
    '/js/services/dealsService.js',
    '/js/services/reviewService.js',
    '/js/services/favoritesService.js',
    '/js/services/historyService.js',
    '/js/services/credibilityService.js',
    '/js/services/recommendationService.js',
    '/js/services/analyticsService.js',
    '/js/services/adminAuthService.js',
    '/js/services/adminDataService.js',
    '/js/services/chatbotService.js', // Depends on others
    '/js/components/businessCard.js',
    '/js/components/reviewCard.js',
    '/js/components/recommendationCard.js',
    '/js/components/chatbotWidget.js',
    '/js/components/analyticsCharts.js',
    '/js/components/adminBusinessEditor.js',
    '/js/components/adminDealEditor.js',
    '/js/components/adminReviewManager.js',
    '/js/components/navigation.js',
    '/js/pages/homePage.js',
    '/js/pages/businessPage.js',
    '/js/pages/favoritesPage.js',
    '/js/pages/adminPage.js',
    '/js/router.js',
    '/js/main.js'
];

export async function buildBundle() {
    let bundleContent = '';
    
    // Helper to fetch file content
    const fetchFile = async (path) => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        return await response.text();
    };

    for (const path of FILE_ORDER) {
        console.log(`Bundling ${path}...`);
        let content = await fetchFile(path);
        
        // Remove imports
        content = content.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
        
        // Remove exports (named and default)
        content = content.replace(/export\s+default\s+/g, '');
        content = content.replace(/export\s+/g, '');
        
        // Wrap in a block to avoid variable collisions if needed, 
        // but for a simple concat bundle where we want shared scope (simulating modules),
        // we actually need them to be in the same scope or attached to a global object.
        // Since we stripped 'export', the functions are now local to the file scope if we wrap them,
        // or global if we don't.
        // To make this work without a complex module system shim, we will:
        // 1. Not wrap individual files.
        // 2. Rely on unique naming (which seems to be the case mostly).
        // 3. Wrap the WHOLE thing in an IIFE.
        
        bundleContent += `\n// --- ${path} ---\n`;
        bundleContent += content;
    }

    // Wrap in IIFE
    return `(() => {\n${bundleContent}\n})();`;
}
