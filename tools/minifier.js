
export function minifyJS(source) {
    // Remove single line comments
    let minified = source.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove extra whitespace (basic)
    // Note: This is a very naive minifier. It preserves newlines to avoid breaking code that relies on ASI.
    // It removes leading/trailing whitespace on lines.
    minified = minified.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');
    
    // Remove spaces around operators (very risky in regex without parser, skipping for safety in "simple" mode)
    // We will just stick to comment removal and whitespace trimming for safety as requested.
    
    return minified;
}

export function minifyCSS(source) {
    // Remove comments
    let minified = source.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove newlines and extra spaces
    minified = minified.replace(/\s+/g, ' ');
    // Remove spaces around braces and colons
    minified = minified.replace(/\s*{\s*/g, '{');
    minified = minified.replace(/\s*}\s*/g, '}');
    minified = minified.replace(/\s*:\s*/g, ':');
    minified = minified.replace(/\s*;\s*/g, ';');
    return minified.trim();
}
