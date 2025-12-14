#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const FILE_ORDER = [
    'js/utils/stringUtils.js',
    'js/utils/validation.js',
    'js/utils/dateUtils.js',
    'js/utils/captcha.js',
    'js/utils/offlineUtils.js',
    'js/services/knowledgeBase.js',
    'js/services/businessService.js',
    'js/services/dealsService.js',
    'js/services/reviewService.js',
    'js/services/favoritesService.js',
    'js/services/historyService.js',
    'js/services/credibilityService.js',
    'js/services/recommendationService.js',
    'js/services/analyticsService.js',
    'js/services/adminAuthService.js',
    'js/services/adminDataService.js',
    'js/services/chatbotService.js',
    'js/components/businessCard.js',
    'js/components/reviewCard.js',
    'js/components/recommendationCard.js',
    'js/components/chatbotWidget.js',
    'js/components/analyticsCharts.js',
    'js/components/adminBusinessEditor.js',
    'js/components/adminDealEditor.js',
    'js/components/adminReviewManager.js',
    'js/components/navigation.js',
    'js/pages/homePage.js',
    'js/pages/businessPage.js',
    'js/pages/favoritesPage.js',
    'js/pages/judgePage.js',
    'js/pages/adminPage.js',
    'js/router.js',
    'js/main.js'
];

const CSS_FILES = [
    'css/base.css',
    'css/layout.css',
    'css/components.css',
    'css/animations.css',
    'css/navigation.css',
    'css/chatbot.css',
    'css/admin.css',
    'css/offline.css',
    'css/styles.css'
];

function stripModuleImportsExports(content) {
    // Remove import statements
    content = content.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    // Remove export statements
    content = content.replace(/export\s+default\s+/g, '');
    content = content.replace(/export\s+/g, '');
    return content;
}

function minifyJS(code) {
    // Don't minify if it breaks the code. Just remove comments.
    code = code.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
    code = code.replace(/\/\/.*$/gm, ''); // Remove line comments
    // Preserve the structure - don't collapse whitespace aggressively
    return code;
}

function minifyCSS(css) {
    // Basic CSS minification
    css = css.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove comments
    css = css.replace(/\s+/g, ' '); // Collapse whitespace
    css = css.replace(/\s*([{}:;,])\s*/g, '$1'); // Remove space around symbols
    return css.trim();
}

async function build() {
    console.log('Starting Node.js build process...');
    const startTime = performance.now();
    const rootDir = process.cwd();

    // Bundle JS
    console.log('Bundling JS...');
    let bundleContent = '';
    
    for (const filePath of FILE_ORDER) {
        const fullPath = path.join(rootDir, filePath);
        try {
            let content = fs.readFileSync(fullPath, 'utf-8');
            content = stripModuleImportsExports(content);
            bundleContent += `\n// --- ${filePath} ---\n`;
            bundleContent += content;
            console.log(`  ✓ ${filePath}`);
        } catch (e) {
            console.warn(`  ✗ Failed to load ${filePath}: ${e.message}`);
        }
    }

    // Wrap in a module-like structure that initializes on DOMContentLoaded
    const bundledJS = `(()=>{
${bundleContent}
// Initialize after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof initRouter === 'function') initRouter();
    if (typeof initChatbot === 'function') initChatbot();
    if (typeof initOfflineDetection === 'function') initOfflineDetection();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  });
} else {
  // DOM already loaded
  if (typeof initRouter === 'function') initRouter();
  if (typeof initChatbot === 'function') initChatbot();
  if (typeof initOfflineDetection === 'function') initOfflineDetection();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
}
})();`;
    const minifiedJS = minifyJS(bundledJS);

    // Bundle CSS
    console.log('Bundling CSS...');
    let bundledCSS = '';
    
    for (const filePath of CSS_FILES) {
        const fullPath = path.join(rootDir, filePath);
        try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            bundledCSS += content + '\n';
            console.log(`  ✓ ${filePath}`);
        } catch (e) {
            console.warn(`  ✗ Failed to load ${filePath}: ${e.message}`);
        }
    }

    const minifiedCSS = minifyCSS(bundledCSS);

    // Write output
    console.log('Writing output files...');
    fs.writeFileSync(path.join(rootDir, 'build/bundle.min.js'), minifiedJS);
    fs.writeFileSync(path.join(rootDir, 'build/styles.min.css'), minifiedCSS);

    const endTime = performance.now();
    console.log(`\n✓ Build complete in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`  JS: ${minifiedJS.length} bytes`);
    console.log(`  CSS: ${minifiedCSS.length} bytes`);
}

build().catch(err => {
    console.error('Build error:', err);
    process.exit(1);
});
