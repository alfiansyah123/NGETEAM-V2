const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'lp1.html');
const cssPath = path.join(__dirname, 'style.css');

let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

// Replace CSS link with inline style
html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    `<style>\n${css}\n</style>`
);

// We need to make the HTML a template literal that accepts targetUrl
// So we must escape backticks and ${} in the HTML, though there shouldn't be any.
html = html.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

// Replace the hardcoded target URLs
html = html.replace(
    "const _0y = ['https://cjfdccd.pathflirt.com/p/XHzGp'];",
    "const _0y = ['${targetUrl}'];"
);
html = html.replace(
    "const _0z = ['https://cjfdccd.pathflirt.com/p/XHzGp'];",
    "const _0z = ['${targetUrl}'];"
);

const output = `export function getLp1Html(targetUrl) {
    return \`${html}\`;
}
`;

const lpsDir = path.join(__dirname, '../functions/lps');
if (!fs.existsSync(lpsDir)) {
    fs.mkdirSync(lpsDir, { recursive: true });
}

fs.writeFileSync(path.join(lpsDir, 'lp1.js'), output);
console.log('Successfully built functions/lps/lp1.js');
