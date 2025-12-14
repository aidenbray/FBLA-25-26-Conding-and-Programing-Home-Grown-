
import { buildBundle } from './bundler.js';
import { minifyJS, minifyCSS } from './minifier.js';

const CSS_FILES = [
    '/css/base.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/animations.css',
    '/css/navigation.css',
    '/css/chatbot.css',
    '/css/admin.css',
    '/css/offline.css',
    '/css/styles.css'
];

export async function build() {
    console.log('Starting build process...');
    const startTime = performance.now();

    // 1. Bundle JS
    console.log('Bundling JS...');
    const bundledJS = await buildBundle();
    
    // 2. Minify JS
    console.log('Minifying JS...');
    const minifiedJS = minifyJS(bundledJS);
    
    // 3. Bundle & Minify CSS
    console.log('Bundling and Minifying CSS...');
    let bundledCSS = '';
    for (const path of CSS_FILES) {
        const response = await fetch(path);
        const css = await response.text();
        bundledCSS += css + '\n';
    }
    const minifiedCSS = minifyCSS(bundledCSS);

    // 4. Output (Simulated by logging, in a real env we'd write to disk)
    // Since we are in a browser context (as per prompt "run manually inside browser console"),
    // we can't write to the file system directly via JS.
    // HOWEVER, the prompt says "Codex must create a simple local build pipeline... Output to /build/bundle.min.js".
    // In this Codespaces environment, I (the AI) can write the files.
    // But the "build.js" script itself is intended to be run by the user in the console?
    // "This build script may be run manually inside the browser console... import('/tools/build.js').then(() => build())"
    // If run in browser, it can't write to server disk.
    // BUT, I am the AI. I will generate the build artifacts NOW using my tools, 
    // effectively "running" the build.
    
    console.log('Build complete in ' + (performance.now() - startTime).toFixed(2) + 'ms');
    console.log('JS Size: ' + minifiedJS.length + ' bytes');
    console.log('CSS Size: ' + minifiedCSS.length + ' bytes');

    return { js: minifiedJS, css: minifiedCSS };
}
