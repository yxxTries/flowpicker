// Shared data + render helpers for Flowpicker's programmatic SEO generators
// (alternatives, best-for, pricing). Loads layers/options/attrs from
// flowpicker.db, loads the compatibility rules, and exposes a page shell + small
// utilities so each generator stays focused on its own template.
//
// X-vs-Y pages are intentionally NOT generated here — they are owned by
// tools/build-compare-pages.js (output /vs/<a>-vs-<b>/) plus the hand-authored
// pages in /compare/. This lib links to those rather than duplicating them.
//
// Depth note: every generated page lives at /<dir>/<slug>.html (depth 1, like
// /compare/*.html and /best/*.html), so all asset paths use a single "../".

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Database = require('better-sqlite3');

const ROOT = path.join(__dirname, '..', '..');
const DB_PATH = path.join(ROOT, 'data', 'flowpicker.db');
const RULES_PATH = path.join(ROOT, 'data', 'rules.js');
const SITE_BASE = 'https://flowpicker.xyz';
const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = new Date().getFullYear();

const LAYER_TITLES = {
  ide: 'IDE / Editor',
  llm: 'LLM Provider / Model',
  integration: 'Integration',
  context: 'Context / RAG',
  agent: 'Agent / Orchestration',
  others: 'Other tools',
};

// Short, query-friendly noun for each layer (used in titles/copy).
const LAYER_NOUN = {
  ide: 'IDE',
  llm: 'LLM',
  integration: 'AI coding tool',
  context: 'context / RAG layer',
  agent: 'coding agent',
  others: 'tool',
};

const ATTR_LABELS = {
  pricing: 'Pricing', priceInput: 'Input price', priceOutput: 'Output price',
  priceCache: 'Cached input', priceTier: 'Price tier', setup: 'Setup effort',
  os: 'Operating systems', released: 'Released', openSource: 'Open source',
  interface: 'Interface', aiIntegration: 'AI integration', extensibility: 'Extensibility',
  collaboration: 'Collaboration', languages: 'Languages', capabilities: 'Capabilities',
  hosting: 'Hosting', contextWindow: 'Context window', maxOutput: 'Max output',
  contextTier: 'Context window', speedTier: 'Speed', latency: 'Latency',
  knowledgeCutoff: 'Knowledge cutoff', modality: 'Modality', modelId: 'Model ID',
  provider: 'Provider', humanEval: 'HumanEval', mmlu: 'MMLU', sweBench: 'SWE-bench',
  benchmark: 'Benchmark', privacy: 'Privacy', modelChoice: 'Model choice',
  category: 'Category', updateMode: 'Update mode', staleness: 'Staleness',
  indexType: 'Index type', indexLimit: 'Index limit', guardrails: 'Guardrails',
  cost: 'Cost model', contextHandling: 'Context handling', compatibility: 'Compatibility',
  autonomy: 'Autonomy', bestFor: 'Best for', notes: 'Notes',
};

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

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
      id: r.id, name: r.name, position: r.position,
      attrs: attrs.get(`${r.layer_id}|${r.id}`) || {},
    });
  }

  return layerRows.map(l => ({
    id: l.id, name: l.name, position: l.position,
    options: opts.get(l.id) || [],
  }));
}

// A value is "real" if it carries information (not empty / placeholder dash).
function has(v) {
  return v != null && v !== '' && v !== '—' && v !== 'N/A';
}

// Parse a "$3", "$0.44", "Free" style price into USD per 1M tokens; null if not parseable.
function parsePrice(v) {
  if (!has(v)) return null;
  const s = String(v).toLowerCase();
  if (s.includes('free')) return 0;
  const m = s.match(/\$\s*([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

// Parse a percentage benchmark ("64%") into a number; null otherwise.
function parsePct(v) {
  if (!has(v)) return null;
  const m = String(v).match(/([\d.]+)\s*%/);
  return m ? parseFloat(m[1]) : null;
}

// Parse a context window ("200K", "1M", "128K-500K") to an approximate token
// count (upper bound of a range) for ranking.
function parseContext(v) {
  if (!has(v)) return null;
  const matches = String(v).toUpperCase().match(/([\d.]+)\s*([KM])/g);
  if (!matches) return null;
  let max = 0;
  for (const m of matches) {
    const num = parseFloat(m);
    const mult = /M/.test(m) ? 1e6 : 1e3;
    max = Math.max(max, num * mult);
  }
  return max || null;
}

// Curated "popular" set per layer — the products people actually search head-to-head.
// Used to decide whether a generated /vs/ or /compare/ comparison page is likely to
// exist for a cross-link, and to bias rankings toward recognizable picks.
const POPULAR = {
  ide: ['cursor', 'windsurf', 'vscode', 'jetbrains', 'zed', 'neovim', 'replit', 'visual-studio', 'antigravity', 'kiro', 'trae', 'void'],
  llm: [
    'claude-sonnet', 'claude-opus', 'claude-haiku', 'gpt4o', 'openai-o3', 'openai-o4-mini',
    'gpt-5-1', 'gpt-5-1-codex', 'gpt-5-5', 'gemini', 'gemini-2-5-pro', 'gemini-3-pro',
    'grok-4.3', 'grok-5', 'grok-code-fast-2', 'deepseek', 'deepseek-v4', 'deepseek-v4-pro',
    'qwen-coder', 'qwen-3-max', 'kimi-k2-6', 'llama-4', 'mistral-large-3', 'codestral',
  ],
  integration: [
    'copilot', 'cursor-built', 'continue', 'cline', 'codeium', 'windsurf-cascade',
    'cody', 'aider', 'tabnine', 'codex-cli', 'amazon-q', 'jetbrains-ai', 'roo-code',
  ],
  context: ['cursor-cb', 'continue-idx', 'greptile', 'sourcegraph-cody', 'copilot-idx', 'pinecone', 'chromadb', 'qdrant', 'pgvector', 'weaviate', 'lancedb', 'milvus'],
  agent: ['claude-code', 'devin', 'cline-agent', 'aider-arch', 'openhands-agent', 'codex-cli-agent', 'langgraph', 'crewai', 'autogen', 'swe-agent', 'cursor-bg-agent'],
  others: ['github', 'gitlab', 'docker', 'sentry', 'datadog', 'grafana', 'prometheus', 'snyk', 'sonarqube', 'podman'],
};

function isPopular(layerId, optId) {
  return (POPULAR[layerId] || []).includes(optId);
}

// "Notability" — bar for whether a product deserves an alternatives or pricing
// page. LLMs: has any benchmark or input price. Other layers: real bestFor +
// capabilities plus a website/pricing signal. Excludes the synthetic placeholder.
function isNotable(layerId, opt) {
  if (opt.id === 'none') return false;
  const a = opt.attrs;
  if (layerId === 'llm') {
    return has(a.sweBench) || has(a.humanEval) || has(a.priceInput);
  }
  const hasSubstance = has(a.bestFor) && has(a.capabilities);
  const hasSignal = has(a.pricing) || has(a.websiteUrl);
  return hasSubstance && hasSignal;
}

function pageHead({ title, description, canonical, ogType = 'article', jsonLd }) {
  const ld = jsonLd ? `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE_BASE}/og-image.png" />
  <meta property="og:site_name" content="Flowpicker" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE_BASE}/og-image.png" />
${ld}
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
        <a href="../compare.html" class="active">Compare</a>
        <a href="../saved.html">Saved</a>
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

function pageFoot() {
  return `  </main>

  <footer class="site-footer">
    <span>Flowpicker — AI coding stack builder. Pick, compare, and share your AI coding workflow.</span>
    <div class="site-footer-links">
      <a href="https://github.com/yxxTries" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="mailto:amil.shahul777@gmail.com">Email</a>
    </div>
  </footer>

  <script>window.App = { features: {} };</script>
  <script src="../src/features/darkmode/darkmode.js"></script>
  <script src="../src/features/browse-menu/browse-menu-preview.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.App && App.features.darkmode) App.features.darkmode.init();
    });
  </script>
</body>
</html>
`;
}

function articleJsonLd({ title, description, canonical }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: { '@type': 'Person', name: 'Amil' },
    publisher: { '@type': 'Organization', name: 'Flowpicker', url: SITE_BASE + '/' },
    datePublished: TODAY,
    dateModified: TODAY,
    mainEntityOfPage: canonical,
  };
}

// Link to a product's static page under /tools/<layer>/<slug>/.
function toolHref(layerId, optId) {
  return `../tools/${layerId}/${slug(optId)}/`;
}

// Resolve a head-to-head comparison link between two products, preferring an
// existing page so we never link to a 404. Checks, in order:
//   1. hand-authored /compare/<a>-vs-<b>.html  (either slug order)
//   2. generated /vs/<a>-vs-<b>/index.html      (build-compare-pages.js)
// Returns { href } or null when no comparison page exists.
function comparePageFor(aId, bId) {
  const aS = slug(aId), bS = slug(bId);
  const orders = [`${aS}-vs-${bS}`, `${bS}-vs-${aS}`];
  for (const o of orders) {
    if (fs.existsSync(path.join(ROOT, 'compare', `${o}.html`))) return { href: `../compare/${o}.html` };
  }
  for (const o of orders) {
    if (fs.existsSync(path.join(ROOT, 'vs', o, 'index.html'))) return { href: `../vs/${o}/` };
  }
  return null;
}

function mkdirp(dir) { fs.mkdirSync(dir, { recursive: true }); }

module.exports = {
  ROOT, SITE_BASE, TODAY, YEAR,
  LAYER_TITLES, LAYER_NOUN, ATTR_LABELS,
  escapeHtml, slug, loadRules, loadLayers,
  has, parsePrice, parsePct, parseContext, isNotable, isPopular, POPULAR,
  pageHead, pageFoot, articleJsonLd, toolHref, comparePageFor, mkdirp,
};
