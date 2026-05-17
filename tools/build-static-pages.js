// Generates one static HTML page per product (option) in data/flowpicker.db.
// Output goes to /tools/<layer-slug>/<option-slug>/index.html.
// Run: node tools/build-static-pages.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Database = require('better-sqlite3');

const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'data', 'flowpicker.db');
const RULES_PATH = path.join(ROOT, 'data', 'rules.js');
const OUT_DIR = path.join(ROOT, 'tools-pages');
const SITE_DIR_NAME = 'tools';
const SITE_BASE = 'https://flowpicker.xyz';
const TODAY = new Date().toISOString().slice(0, 10);

const LAYER_SLUGS = {
  ide: 'ide',
  llm: 'llm',
  integration: 'integration',
  context: 'context',
  agent: 'agent',
  others: 'others',
};

const LAYER_TITLES = {
  ide: 'IDE / Editor',
  llm: 'LLM Provider / Model',
  integration: 'Integration',
  context: 'Context / RAG',
  agent: 'Agent / Orchestration',
  others: 'Other tools',
};

const ATTR_LABELS = {
  pricing: 'Pricing',
  priceInput: 'Input price',
  priceOutput: 'Output price',
  priceCache: 'Cache price',
  priceTier: 'Price tier',
  setup: 'Setup effort',
  os: 'Operating systems',
  released: 'Released',
  openSource: 'Open source',
  interface: 'Interface',
  aiIntegration: 'AI integration',
  extensibility: 'Extensibility',
  collaboration: 'Collaboration',
  languages: 'Languages',
  capabilities: 'Capabilities',
  hosting: 'Hosting',
  contextWindow: 'Context window',
  maxOutput: 'Max output',
  contextTier: 'Context tier',
  speedTier: 'Speed tier',
  latency: 'Latency',
  knowledgeCutoff: 'Knowledge cutoff',
  modality: 'Modality',
  modelId: 'Model ID',
  provider: 'Provider',
  humanEval: 'HumanEval',
  mmlu: 'MMLU',
  sweBench: 'SWE-Bench',
  benchmark: 'Benchmark',
  privacy: 'Privacy',
  modelChoice: 'Model choice',
  category: 'Category',
  updateMode: 'Update mode',
  staleness: 'Staleness',
  indexType: 'Index type',
  indexLimit: 'Index limit',
  guardrails: 'Guardrails',
  cost: 'Cost',
  contextHandling: 'Context handling',
  compatibility: 'Compatibility',
  autonomy: 'Autonomy',
  bestFor: 'Best for',
  notes: 'Notes',
};

// Order in which attribute rows render on the page (when present).
const ATTR_ORDER = [
  'pricing', 'priceInput', 'priceOutput', 'priceCache', 'priceTier',
  'contextWindow', 'maxOutput', 'contextTier', 'speedTier', 'latency',
  'knowledgeCutoff', 'modality', 'modelId', 'provider',
  'humanEval', 'mmlu', 'sweBench', 'benchmark',
  'setup', 'os', 'released', 'openSource', 'interface',
  'aiIntegration', 'extensibility', 'collaboration', 'languages',
  'hosting', 'privacy', 'modelChoice', 'category',
  'updateMode', 'staleness', 'indexType', 'indexLimit',
  'guardrails', 'cost', 'contextHandling', 'compatibility', 'autonomy',
  'capabilities',
];

function loadRules() {
  const text = fs.readFileSync(RULES_PATH, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(text + '\nthis.__rules = COMPATIBILITY_RULES;', sandbox);
  return sandbox.__rules;
}

function loadLayers() {
  const db = new Database(DB_PATH, { readonly: true });
  const layerRows = db.prepare('SELECT id, name, position FROM layers ORDER BY position').all();
  const optionRows = db.prepare('SELECT layer_id, id, name, position FROM options ORDER BY layer_id, position').all();
  const attrRows = db.prepare('SELECT layer_id, option_id, key, value FROM option_attrs').all();
  db.close();

  const attrs = new Map();
  for (const r of attrRows) {
    const k = `${r.layer_id}|${r.option_id}`;
    if (!attrs.has(k)) attrs.set(k, {});
    attrs.get(k)[r.key] = r.value;
  }

  const opts = new Map();
  for (const r of optionRows) {
    if (!opts.has(r.layer_id)) opts.set(r.layer_id, []);
    opts.get(r.layer_id).push({
      id: r.id,
      name: r.name,
      attrs: attrs.get(`${r.layer_id}|${r.id}`) || {},
    });
  }

  return layerRows.map(l => ({
    id: l.id,
    name: l.name,
    options: opts.get(l.id) || [],
  }));
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Build a synthetic stack with this option in its layer, plus optional "other" pick from
// each other layer (we don't fill them — keep stack minimal so single-layer rules fire).
function stackFor(layers, option, layerId) {
  const stack = {};
  for (const l of layers) {
    stack[l.id] = null;
  }
  stack[layerId] = { id: option.id, name: option.name, ...option.attrs };
  return stack;
}

// Returns { conflicts: [{ withLayerId, withOption, message }], lonely: [{ message }] }
// For every other option in every other layer, run the full rule set against
// a minimal {thisLayer: thisOption, otherLayer: otherOption} stack and collect
// any rule that fires.
function computeRelations(layers, rules, layer, option) {
  const conflicts = [];
  const seenPairs = new Set();
  // Single-pick rules (only this option set)
  const baseStack = stackFor(layers, option, layer.id);
  for (const rule of rules) {
    try {
      if (rule.when(baseStack)) {
        const msg = rule.message(baseStack);
        const k = `solo|${rule.id}`;
        if (!seenPairs.has(k)) {
          seenPairs.add(k);
          conflicts.push({ withLayerId: null, withOption: null, ruleId: rule.id, message: msg });
        }
      }
    } catch (_) { /* rule needs more fields — skip */ }
  }

  // Pairwise: this option + one other option from a different layer.
  // For each rule, only include it if the rule would NOT fire from the other
  // option alone — i.e. the conflict genuinely involves this product.
  const seenRules = new Set(conflicts.map(c => c.ruleId));
  for (const otherLayer of layers) {
    if (otherLayer.id === layer.id) continue;
    for (const otherOpt of otherLayer.options) {
      const stack = stackFor(layers, option, layer.id);
      stack[otherLayer.id] = { id: otherOpt.id, name: otherOpt.name, ...otherOpt.attrs };
      const otherOnlyStack = stackFor(layers, otherOpt, otherLayer.id);
      for (const rule of rules) {
        if (seenRules.has(rule.id)) continue;
        let firesPair = false;
        let firesOtherOnly = false;
        try { firesPair = !!rule.when(stack); } catch (_) {}
        try { firesOtherOnly = !!rule.when(otherOnlyStack); } catch (_) {}
        if (firesPair && !firesOtherOnly) {
          let msg = '';
          try { msg = rule.message(stack); } catch (_) { continue; }
          seenRules.add(rule.id);
          conflicts.push({
            withLayerId: otherLayer.id,
            withOption: { id: otherOpt.id, name: otherOpt.name },
            ruleId: rule.id,
            message: msg,
          });
        }
      }
    }
  }

  return conflicts;
}

// "Works well with" = options in other layers that have NO compatibility conflict
// with this option AND share at least one signal (e.g. both common picks).
// We surface a curated short list: for each other layer, the first 4 options that don't conflict.
function computeWorksWith(layers, conflicts, thisLayerId, thisOptionId) {
  const conflictKeys = new Set(conflicts
    .filter(c => c.withOption)
    .map(c => `${c.withLayerId}|${c.withOption.id}`));
  const byLayer = {};
  for (const l of layers) {
    if (l.id === thisLayerId) continue;
    byLayer[l.id] = l.options
      .filter(o => !conflictKeys.has(`${l.id}|${o.id}`))
      .slice(0, 4)
      .map(o => ({ id: o.id, name: o.name }));
  }
  return byLayer;
}

function pageHeader({ title, description, canonical }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE_BASE}/og-image.png" />
  <meta property="og:site_name" content="Flowpicker" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE_BASE}/og-image.png" />

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P6NNRR7E8G"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P6NNRR7E8G');
  </script>

  <script>
    (() => {
      const saved = localStorage.getItem('flowpicker-dark-mode');
      const isDark = saved !== null ? saved === 'true' : true;
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.backgroundColor = '#1a1a19';
      } else {
        document.documentElement.style.backgroundColor = '#fafaf9';
      }
    })();
  </script>

  <link rel="stylesheet" href="../../../src/styles/tokens.css" />
  <link rel="stylesheet" href="../../../src/styles/base.css" />
  <link rel="stylesheet" href="../../../src/features/browse-menu/browse-menu.css" />
  <link rel="stylesheet" href="../../../src/features/seo-pages/seo-pages.css" />
</head>
<body>
  <main class="page">
    <header class="site-header">
      <a href="../../../" class="brand">Flowpicker</a>
      <nav class="site-nav" aria-label="Primary">
        <a href="../../../index.html">Plan</a>
        <a href="../../../browse.html" id="browse-link">Browse</a>
        <a href="../../../templates.html">Templates</a>
        <a href="../../../compare.html">Compare</a>
        <a href="../../../saved.html">Saved</a>
      </nav>
      <nav class="browse-menu browse-menu-preview" aria-label="Layers" aria-hidden="true" hidden>
        <button type="button" class="browse-menu-item" data-layer="ide" style="--i:0" tabindex="-1">IDE / Editor</button>
        <button type="button" class="browse-menu-item" data-layer="llm" style="--i:1" tabindex="-1">LLM Provider / Model</button>
        <button type="button" class="browse-menu-item" data-layer="integration" style="--i:2" tabindex="-1">Integration</button>
        <button type="button" class="browse-menu-item" data-layer="context" style="--i:3" tabindex="-1">Context / RAG</button>
        <button type="button" class="browse-menu-item" data-layer="agent" style="--i:4" tabindex="-1">Agent / Orchestration</button>
        <button type="button" class="browse-menu-item" data-layer="others" style="--i:5" tabindex="-1">Others</button>
      </nav>
      <button type="button" id="dark-mode-toggle" class="dark-mode-toggle" aria-label="Toggle dark mode">🌙</button>
    </header>
`;
}

function pageFooter() {
  return `  </main>

  <footer class="site-footer">
    <span>Flowpicker — AI coding stack builder. Pick, compare, and share your AI coding workflow.</span>
    <div class="site-footer-links">
      <a href="https://github.com/yxxTries" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="mailto:amil.shahul777@gmail.com">Email</a>
    </div>
  </footer>

  <script>window.App = { features: {} };</script>
  <script src="../../../src/features/darkmode/darkmode.js"></script>
  <script src="../../../src/features/browse-menu/browse-menu-preview.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.App && App.features.darkmode) App.features.darkmode.init();
    });
  </script>
</body>
</html>
`;
}

function renderProductPage({ layer, option, conflicts, worksWith, layers }) {
  const a = option.attrs;
  const layerTitle = LAYER_TITLES[layer.id] || layer.name;
  const layerSlug = LAYER_SLUGS[layer.id] || slug(layer.id);
  const optSlug = slug(option.id);
  const canonical = `${SITE_BASE}/${SITE_DIR_NAME}/${layerSlug}/${optSlug}/`;
  const tagline = a.bestFor || a.notes || `${option.name} — ${layerTitle.toLowerCase()} for AI coding workflows.`;
  const title = `${option.name} — ${layerTitle} for AI coding (2026 review)`;
  const description = `${option.name} ${layerTitle.toLowerCase()}: ${tagline.slice(0, 140)}`.replace(/\s+/g, ' ').trim();

  const attrRows = ATTR_ORDER
    .filter(k => a[k] != null && a[k] !== '' && a[k] !== '—')
    .map(k => `          <tr><td>${escapeHtml(ATTR_LABELS[k] || k)}</td><td>${escapeHtml(a[k])}</td></tr>`)
    .join('\n');

  const linksRow = [];
  if (a.websiteUrl) linksRow.push(`<a href="${escapeHtml(a.websiteUrl)}" target="_blank" rel="noopener nofollow">Website</a>`);
  if (a.docsUrl) linksRow.push(`<a href="${escapeHtml(a.docsUrl)}" target="_blank" rel="noopener nofollow">Docs</a>`);

  const conflictsHtml = conflicts.length === 0
    ? `<p class="seo-empty">No known compatibility conflicts detected.</p>`
    : `<ul>${conflicts.map(c => `
          <li>${escapeHtml(c.message)}</li>`).join('')}
        </ul>`;

  const worksWithSections = Object.keys(worksWith)
    .filter(lid => worksWith[lid].length > 0)
    .map(lid => {
      const items = worksWith[lid].map(o => {
        const href = `../../${LAYER_SLUGS[lid] || slug(lid)}/${slug(o.id)}/`;
        return `<li><a href="${escapeHtml(href)}">${escapeHtml(o.name)}</a></li>`;
      }).join('');
      return `        <div class="seo-works-col">
          <h3>${escapeHtml(LAYER_TITLES[lid] || lid)}</h3>
          <ul>${items}</ul>
        </div>`;
    }).join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: option.name,
    description: tagline,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: a.os || 'Any',
    url: canonical,
    ...(a.pricing ? { offers: { '@type': 'Offer', price: a.pricing.toLowerCase().includes('free') ? '0' : undefined, priceCurrency: 'USD', description: a.pricing } } : {}),
  };

  return pageHeader({ title, description, canonical })
    + `
    <p class="seo-breadcrumb"><a href="../../../">Home</a> › <a href="../../">Tools</a> › <a href="../">${escapeHtml(layerTitle)}</a> › ${escapeHtml(option.name)}</p>

    <section class="seo-hero">
      <h1>${escapeHtml(option.name)}</h1>
      <p class="seo-hero-sub">${escapeHtml(layerTitle)} · ${escapeHtml(tagline)}</p>
      ${linksRow.length ? `<p class="seo-hero-links">${linksRow.join(' · ')}</p>` : ''}
    </section>

    <section class="seo-section">
      <h2>At a glance</h2>
      <table class="seo-compare-table">
        <tbody>
${attrRows}
        </tbody>
      </table>
    </section>

    ${a.capabilities ? `<section class="seo-section">
      <h2>What ${escapeHtml(option.name)} does</h2>
      <p>${escapeHtml(a.capabilities)}</p>
    </section>` : ''}

    ${a.bestFor ? `<section class="seo-section">
      <h2>Best for</h2>
      <p>${escapeHtml(a.bestFor)}</p>
    </section>` : ''}

    <section class="seo-section">
      <h2>Works well with</h2>
      ${worksWithSections ? `<div class="seo-works-grid">
${worksWithSections}
      </div>` : `<p class="seo-empty">Pair ${escapeHtml(option.name)} with tools from any layer in the <a href="../../../index.html">stack planner</a>.</p>`}
    </section>

    <section class="seo-section">
      <h2>Conflicts &amp; caveats</h2>
      ${conflictsHtml}
    </section>

    <div class="seo-cta">
      <p class="seo-cta-text">Build a full stack around ${escapeHtml(option.name)} — Flowpicker shows compatibility warnings before you commit.</p>
      <a class="seo-cta-link" href="../../../index.html">Open the stack planner →</a>
    </div>

    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
`
    + pageFooter();
}

function renderLayerIndex(layer, options) {
  const layerTitle = LAYER_TITLES[layer.id] || layer.name;
  const layerSlug = LAYER_SLUGS[layer.id] || slug(layer.id);
  const canonical = `${SITE_BASE}/${SITE_DIR_NAME}/${layerSlug}/`;
  const title = `${layerTitle} tools for AI coding — full list (2026)`;
  const description = `Every ${layerTitle.toLowerCase()} option Flowpicker tracks for AI coding workflows. Pricing, setup, and compatibility for each.`;

  const items = options.map(o => {
    const tagline = o.attrs.bestFor || o.attrs.notes || '';
    return `      <li><a href="${escapeHtml(slug(o.id))}/"><strong>${escapeHtml(o.name)}</strong></a>${tagline ? ` — ${escapeHtml(tagline)}` : ''}</li>`;
  }).join('\n');

  // Depth-2 (../) header — same template as pageHeader but two-dot paths.
  const headerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE_BASE}/og-image.png" />
  <meta property="og:site_name" content="Flowpicker" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE_BASE}/og-image.png" />

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P6NNRR7E8G"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P6NNRR7E8G');
  </script>

  <script>
    (() => {
      const saved = localStorage.getItem('flowpicker-dark-mode');
      const isDark = saved !== null ? saved === 'true' : true;
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.backgroundColor = '#1a1a19';
      } else {
        document.documentElement.style.backgroundColor = '#fafaf9';
      }
    })();
  </script>

  <link rel="stylesheet" href="../../src/styles/tokens.css" />
  <link rel="stylesheet" href="../../src/styles/base.css" />
  <link rel="stylesheet" href="../../src/features/browse-menu/browse-menu.css" />
  <link rel="stylesheet" href="../../src/features/seo-pages/seo-pages.css" />
</head>
<body>
  <main class="page">
    <header class="site-header">
      <a href="../../" class="brand">Flowpicker</a>
      <nav class="site-nav" aria-label="Primary">
        <a href="../../index.html">Plan</a>
        <a href="../../browse.html" id="browse-link">Browse</a>
        <a href="../../templates.html">Templates</a>
        <a href="../../compare.html">Compare</a>
        <a href="../../saved.html">Saved</a>
      </nav>
      <button type="button" id="dark-mode-toggle" class="dark-mode-toggle" aria-label="Toggle dark mode">🌙</button>
    </header>
`;

  const footerHtml = `  </main>

  <footer class="site-footer">
    <span>Flowpicker — AI coding stack builder. Pick, compare, and share your AI coding workflow.</span>
    <div class="site-footer-links">
      <a href="https://github.com/yxxTries" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="mailto:amil.shahul777@gmail.com">Email</a>
    </div>
  </footer>

  <script>window.App = { features: {} };</script>
  <script src="../../src/features/darkmode/darkmode.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.App && App.features.darkmode) App.features.darkmode.init();
    });
  </script>
</body>
</html>
`;

  return headerHtml
    + `
    <p class="seo-breadcrumb"><a href="../../">Home</a> › <a href="../">Tools</a> › ${escapeHtml(layerTitle)}</p>

    <section class="seo-hero">
      <h1>${escapeHtml(layerTitle)} for AI coding</h1>
      <p>Every ${escapeHtml(layerTitle.toLowerCase())} option Flowpicker tracks, with pricing, setup notes, and compatibility for each.</p>
    </section>

    <section class="seo-section">
      <ul class="seo-tool-list">
${items}
      </ul>
    </section>

    <div class="seo-cta">
      <a class="seo-cta-link" href="../../index.html">Build a full stack →</a>
    </div>
`
    + footerHtml;
}

function renderToolsIndex(layers) {
  const canonical = `${SITE_BASE}/${SITE_DIR_NAME}/`;
  const title = `AI coding tools directory — IDEs, LLMs, agents and more`;
  const description = `Flowpicker's full directory of AI coding tools — every IDE, LLM, integration, RAG layer, and agent we track, with pricing and compatibility notes.`;

  const sections = layers.map(l => {
    const lTitle = LAYER_TITLES[l.id] || l.name;
    const lSlug = LAYER_SLUGS[l.id] || slug(l.id);
    const links = l.options.map(o => `        <li><a href="${escapeHtml(lSlug)}/${escapeHtml(slug(o.id))}/">${escapeHtml(o.name)}</a></li>`).join('\n');
    return `    <section class="seo-section">
      <h2><a href="${escapeHtml(lSlug)}/">${escapeHtml(lTitle)}</a></h2>
      <ul class="seo-tool-list">
${links}
      </ul>
    </section>`;
  }).join('\n');

  // Manual header for the tools index (depth 1 instead of 3)
  const header = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE_BASE}/og-image.png" />
  <meta property="og:site_name" content="Flowpicker" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE_BASE}/og-image.png" />

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P6NNRR7E8G"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P6NNRR7E8G');
  </script>

  <script>
    (() => {
      const saved = localStorage.getItem('flowpicker-dark-mode');
      const isDark = saved !== null ? saved === 'true' : true;
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.backgroundColor = '#1a1a19';
      } else {
        document.documentElement.style.backgroundColor = '#fafaf9';
      }
    })();
  </script>

  <link rel="stylesheet" href="../src/styles/tokens.css" />
  <link rel="stylesheet" href="../src/styles/base.css" />
  <link rel="stylesheet" href="../src/features/browse-menu/browse-menu.css" />
  <link rel="stylesheet" href="../src/features/seo-pages/seo-pages.css" />
</head>
<body>
  <main class="page">
    <header class="site-header">
      <a href="../" class="brand">Flowpicker</a>
      <nav class="site-nav" aria-label="Primary">
        <a href="../index.html">Plan</a>
        <a href="../browse.html" id="browse-link">Browse</a>
        <a href="../templates.html">Templates</a>
        <a href="../compare.html">Compare</a>
        <a href="../saved.html">Saved</a>
      </nav>
      <button type="button" id="dark-mode-toggle" class="dark-mode-toggle" aria-label="Toggle dark mode">🌙</button>
    </header>

    <p class="seo-breadcrumb"><a href="../">Home</a> › Tools</p>

    <section class="seo-hero">
      <h1>AI coding tools directory</h1>
      <p>Every IDE, LLM, integration, context layer, and agent that Flowpicker tracks. Click any tool for pricing, setup notes, what it works with, and known conflicts.</p>
    </section>

${sections}

    <div class="seo-cta">
      <a class="seo-cta-link" href="../index.html">Build a stack from these tools →</a>
    </div>
  </main>

  <footer class="site-footer">
    <span>Flowpicker — AI coding stack builder. Pick, compare, and share your AI coding workflow.</span>
    <div class="site-footer-links">
      <a href="https://github.com/yxxTries" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="mailto:amil.shahul777@gmail.com">Email</a>
    </div>
  </footer>

  <script>window.App = { features: {} };</script>
  <script src="../src/features/darkmode/darkmode.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.App && App.features.darkmode) App.features.darkmode.init();
    });
  </script>
</body>
</html>
`;
  return header;
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

(function main() {
  const layers = loadLayers();
  const rules = loadRules();
  const outRoot = path.join(ROOT, SITE_DIR_NAME);

  let pageCount = 0;
  for (const layer of layers) {
    const layerSlug = LAYER_SLUGS[layer.id] || slug(layer.id);
    const layerDir = path.join(outRoot, layerSlug);
    mkdirp(layerDir);

    for (const option of layer.options) {
      const conflicts = computeRelations(layers, rules, layer, option);
      const worksWith = computeWorksWith(layers, conflicts, layer.id, option.id);
      const optDir = path.join(layerDir, slug(option.id));
      mkdirp(optDir);
      const html = renderProductPage({ layer, option, conflicts, worksWith, layers });
      fs.writeFileSync(path.join(optDir, 'index.html'), html, 'utf8');
      pageCount++;
    }

    fs.writeFileSync(path.join(layerDir, 'index.html'), renderLayerIndex(layer, layer.options), 'utf8');
    pageCount++;
  }

  fs.writeFileSync(path.join(outRoot, 'index.html'), renderToolsIndex(layers), 'utf8');
  pageCount++;

  console.log(`Wrote ${pageCount} static pages under ${outRoot}`);
})();
