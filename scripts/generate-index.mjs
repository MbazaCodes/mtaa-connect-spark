/**
 * Post-build script: generates dist/client/index.html from built assets.
 * TanStack Start builds SSR-only (no static index.html).
 * This creates an SPA fallback for static hosting (Vercel, Netlify, etc.)
 */
import { readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const clientDir = join(process.cwd(), 'dist', 'client');
const assetsDir = join(clientDir, 'assets');

if (!existsSync(assetsDir)) {
  console.error('dist/client/assets not found — run npm run build first');
  process.exit(1);
}

const files = readdirSync(assetsDir);

// Find entry files by pattern
const mainCss = files.filter(f => f.endsWith('.css')).sort((a, b) => {
  // Prefer styles-*.css (main bundle) over component CSS
  if (a.startsWith('styles-')) return -1;
  if (b.startsWith('styles-')) return 1;
  return b.length - a.length;
});

const mainJs = files.filter(f => f.endsWith('.js')).sort((a, b) => {
  // clone-app is the main bundle, index is the entry
  if (a.startsWith('clone-app-')) return -1;
  if (b.startsWith('clone-app-')) return 1;
  return 0;
});

// Build CSS link tags
const cssLinks = mainCss.map(f => `    <link rel="stylesheet" href="/assets/${f}">`).join('\n');

// Build JS script tags — load index first (tiny entry), then the big bundle
const indexJs = mainJs.find(f => f.match(/^index-.*\.js$/) && !f.includes('DRz5BQNA'));
const cloneJs = mainJs.find(f => f.startsWith('clone-app-'));
const mountJs = mainJs.find(f => f.startsWith('cloned-app-mount-'));

const scripts = [indexJs, cloneJs, mountJs]
  .filter(Boolean)
  .map(f => `    <script type="module" src="/assets/${f}"></script>`)
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="sw">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#059669">
    <meta name="description" content="E-MTAA — Mfumo wa Kidijitali wa Serikali ya Mtaa Tanzania | Tanzania Digital Local Government Portal">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>E-MTAA | Tanzania Digital Local Government</title>
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="apple-touch-icon" href="/favicon.png">
${cssLinks}
  </head>
  <body>
    <div id="root"></div>
${scripts}
  </body>
</html>
`;

const outPath = join(clientDir, 'index.html');
writeFileSync(outPath, html);
console.log(`✅ Generated ${outPath}`);
console.log(`   CSS: ${mainCss.length} files`);
console.log(`   JS:  ${[indexJs, cloneJs, mountJs].filter(Boolean).length} files`);
