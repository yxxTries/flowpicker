// Generates sitemap.xml from the current state of the repo:
//   - Top-level pages (index, browse, templates, compare, saved)
//   - /compare/*.html
//   - /best/*.html
//   - /tools/index.html, /tools/<layer>/index.html, /tools/<layer>/<slug>/index.html
// Run: node tools/build-sitemap.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_BASE = 'https://flowpicker.xyz';
const TODAY = new Date().toISOString().slice(0, 10);

const TOP_LEVEL = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/browse.html', priority: '0.8', changefreq: 'weekly' },
  { loc: '/templates.html', priority: '0.8', changefreq: 'monthly' },
  { loc: '/compare.html', priority: '0.9', changefreq: 'weekly' },
  { loc: '/saved.html', priority: '0.4', changefreq: 'monthly' },
];

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.html'));
}

function collectToolsPages() {
  const out = [];
  const toolsDir = path.join(ROOT, 'tools');
  if (!fs.existsSync(toolsDir)) return out;

  if (fs.existsSync(path.join(toolsDir, 'index.html'))) {
    out.push({ loc: '/tools/', priority: '0.8', changefreq: 'monthly' });
  }

  const layers = fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const layer of layers) {
    const layerDir = path.join(toolsDir, layer);
    if (fs.existsSync(path.join(layerDir, 'index.html'))) {
      out.push({ loc: `/tools/${layer}/`, priority: '0.7', changefreq: 'monthly' });
    }
    const products = fs.readdirSync(layerDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const product of products) {
      if (fs.existsSync(path.join(layerDir, product, 'index.html'))) {
        out.push({ loc: `/tools/${layer}/${product}/`, priority: '0.6', changefreq: 'monthly' });
      }
    }
  }
  return out;
}

function urlEntry({ loc, priority, changefreq }) {
  return `  <url>
    <loc>${SITE_BASE}${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

(function main() {
  const entries = [];
  for (const e of TOP_LEVEL) entries.push(e);

  for (const f of listHtml(path.join(ROOT, 'compare'))) {
    entries.push({ loc: `/compare/${f}`, priority: '0.8', changefreq: 'monthly' });
  }
  for (const f of listHtml(path.join(ROOT, 'best'))) {
    entries.push({ loc: `/best/${f}`, priority: '0.8', changefreq: 'monthly' });
  }
  for (const e of collectToolsPages()) entries.push(e);

  // Dedupe by loc
  const seen = new Set();
  const deduped = entries.filter(e => {
    if (seen.has(e.loc)) return false;
    seen.add(e.loc);
    return true;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${deduped.map(urlEntry).join('\n')}
</urlset>
`;

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log(`Wrote sitemap.xml with ${deduped.length} URLs`);
})();
