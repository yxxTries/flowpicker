// Generates AEO-optimized "X vs Y" comparison pages for LLMs, programmatically,
// from data/flowpicker.db. Output: /vs/<a>-vs-<b>/index.html.
//
// These are the scalable programmatic-SEO surface ("X vs Y" is the highest-intent
// query in this niche). Every page is built to be quoted by answer engines (Google
// AI Overviews, ChatGPT, Perplexity):
//   - a direct verdict in the first paragraph (standalone answer)
//   - a balanced data-driven comparison table
//   - explicit scenario recommendations ("pick A if…", "pick B if…")
//   - FAQPage + Article schema with a fresh dateModified
//
// Matchups are seeded from a curated list of flagship models so each page is
// genuinely differentiated by real benchmark/price data — never thin. Slugs that
// collide with the hand-authored pages in /compare/ are skipped.
//
// Run: node tools/build-compare-pages.js

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'data', 'flowpicker.db');
const OUT_DIR = path.join(ROOT, 'vs');
const COMPARE_DIR = path.join(ROOT, 'compare');
const SITE_BASE = 'https://flowpicker.xyz';
const TODAY = new Date().toISOString().slice(0, 10);

// Flagship anchors people actually search "X vs Y" for. Every other strong model
// is compared against each anchor; anchors are also compared against each other.
const ANCHORS = [
  'claude-sonnet', 'claude-opus', 'gpt-5-1', 'gpt-5-1-codex', 'gemini-3-pro',
];
// Challengers worth a dedicated page against the anchors.
const CHALLENGERS = [
  'claude-sonnet', 'claude-opus', 'claude-haiku-4-5-fast',
  'gpt-5-1', 'gpt-5-1-codex', 'gpt-5-5', 'openai-o3',
  'gemini-3-pro', 'gemini-3-flash', 'gemini-2-5-pro',
  'grok-5', 'grok-code-fast-2',
  'deepseek-v4', 'deepseek-r2', 'qwen-coder-next', 'qwen-3-max',
  'kimi-k3', 'glm-5.1', 'mistral-large-4',
];

// Rows shown in the comparison table, in order. Each page only renders rows where
// at least one of the two models has a value.
const TABLE_ROWS = [
  { key: 'provider', label: 'Provider' },
  { key: 'released', label: 'Released' },
  { key: 'sweBench', label: 'SWE-bench Verified' },
  { key: 'humanEval', label: 'HumanEval' },
  { key: 'mmlu', label: 'MMLU' },
  { key: 'contextWindow', label: 'Context window' },
  { key: 'maxOutput', label: 'Max output' },
  { key: 'priceInput', label: 'Input price (per 1M)' },
  { key: 'priceOutput', label: 'Output price (per 1M)' },
  { key: 'priceTier', label: 'Price tier' },
  { key: 'speedTier', label: 'Speed' },
  { key: 'hosting', label: 'Hosting' },
  { key: 'modality', label: 'Modality' },
  { key: 'knowledgeCutoff', label: 'Knowledge cutoff' },
];

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function hasValue(v) {
  return v != null && v !== '' && v !== '—';
}

function parsePercent(v) {
  if (!hasValue(v)) return null;
  const m = String(v).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function parseContext(v) {
  if (!hasValue(v)) return null;
  const m = String(v).toUpperCase().match(/(\d+(?:\.\d+)?)\s*([KM])?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (m[2] === 'M') n *= 1000;
  return n;
}

const PRICE_RANK = { free: 0, budget: 1, mid: 2, premium: 3 };
function priceRank(v) {
  if (!hasValue(v)) return null;
  const r = PRICE_RANK[String(v).trim().toLowerCase()];
  return r == null ? null : r;
}

function loadModels() {
  const db = new Database(DB_PATH, { readonly: true });
  const optionRows = db.prepare("SELECT id, name FROM options WHERE layer_id='llm' ORDER BY position").all();
  const attrRows = db.prepare("SELECT option_id, key, value FROM option_attrs WHERE layer_id='llm'").all();
  db.close();
  const attrs = new Map();
  for (const r of attrRows) {
    if (!attrs.has(r.option_id)) attrs.set(r.option_id, {});
    attrs.get(r.option_id)[r.key] = r.value;
  }
  const out = new Map();
  for (const r of optionRows) {
    out.set(r.id, { id: r.id, name: r.name, ...(attrs.get(r.id) || {}) });
  }
  return out;
}

// Build the verdict sentence + scenario picks from real data. Returns
// { verdict, pickA[], pickB[] } — all derived, no hand-writing per pair.
function analyze(a, b) {
  const reasonsA = [];
  const reasonsB = [];

  const sweA = parsePercent(a.sweBench), sweB = parsePercent(b.sweBench);
  let benchLeader = null;
  if (sweA != null && sweB != null && sweA !== sweB) {
    benchLeader = sweA > sweB ? a : b;
    (sweA > sweB ? reasonsA : reasonsB).push(
      `it scores higher on SWE-bench Verified (${sweA > sweB ? a.sweBench : b.sweBench} vs ${sweA > sweB ? b.sweBench : a.sweBench}), the best proxy for real-world coding`);
  }

  const pa = priceRank(a.priceTier), pb = priceRank(b.priceTier);
  let cheaper = null;
  if (pa != null && pb != null && pa !== pb) {
    cheaper = pa < pb ? a : b;
    (pa < pb ? reasonsA : reasonsB).push(
      `it's cheaper (${pa < pb ? a.priceTier : b.priceTier} tier vs ${pa < pb ? b.priceTier : a.priceTier})`);
  }

  const ca = parseContext(a.contextWindow), cb = parseContext(b.contextWindow);
  if (ca != null && cb != null && ca !== cb) {
    (ca > cb ? reasonsA : reasonsB).push(
      `it has a larger context window (${ca > cb ? a.contextWindow : b.contextWindow} vs ${ca > cb ? b.contextWindow : a.contextWindow})`);
  }

  const speedRank = { fast: 0, standard: 1, medium: 1, 'slow/reasoning': 2 };
  const sa = speedRank[String(a.speedTier || '').toLowerCase()];
  const sb = speedRank[String(b.speedTier || '').toLowerCase()];
  if (sa != null && sb != null && sa !== sb) {
    (sa < sb ? reasonsA : reasonsB).push(`it responds faster (${sa < sb ? a.speedTier : b.speedTier})`);
  }

  if (hasValue(a.bestFor)) reasonsA.push(`it's tuned for ${String(a.bestFor).charAt(0).toLowerCase() + String(a.bestFor).slice(1)}`);
  if (hasValue(b.bestFor)) reasonsB.push(`it's tuned for ${String(b.bestFor).charAt(0).toLowerCase() + String(b.bestFor).slice(1)}`);

  // Headline verdict: lead with the SWE-bench leader, fall back to the cheaper one.
  let verdict;
  if (benchLeader) {
    const other = benchLeader === a ? b : a;
    verdict = `${benchLeader.name} is the stronger coder of the two on benchmarks, but ${other.name} can be the better pick when cost, speed, or context window matter more.`;
  } else if (cheaper) {
    const other = cheaper === a ? b : a;
    verdict = `${a.name} and ${b.name} are closely matched on coding benchmarks; ${cheaper.name} wins on price, while ${other.name} may edge ahead on other specs below.`;
  } else {
    verdict = `${a.name} and ${b.name} are closely matched — the right choice comes down to price, context window, and how each behaves in your workflow.`;
  }

  return { verdict, reasonsA: reasonsA.slice(0, 4), reasonsB: reasonsB.slice(0, 4) };
}

function pageHtml(a, b) {
  const aName = a.name, bName = b.name;
  const canonical = `${SITE_BASE}/vs/${slug(a.id)}-vs-${slug(b.id)}/`;
  const title = `${aName} vs ${bName} for coding — benchmarks, pricing & verdict (2026)`;
  const { verdict, reasonsA, reasonsB } = analyze(a, b);
  const description = `${aName} vs ${bName} for coding: SWE-bench, HumanEval, context window, and price compared. ${verdict}`.replace(/\s+/g, ' ').slice(0, 158);

  const rows = TABLE_ROWS
    .filter(r => hasValue(a[r.key]) || hasValue(b[r.key]))
    .map(r => `          <tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(hasValue(a[r.key]) ? a[r.key] : '—')}</td><td>${escapeHtml(hasValue(b[r.key]) ? b[r.key] : '—')}</td></tr>`)
    .join('\n');

  const liA = reasonsA.length
    ? reasonsA.map(t => `        <li>${escapeHtml(cap(t))}.</li>`).join('\n')
    : `        <li>You already use ${escapeHtml(aName)} or its provider's ecosystem.</li>`;
  const liB = reasonsB.length
    ? reasonsB.map(t => `        <li>${escapeHtml(cap(t))}.</li>`).join('\n')
    : `        <li>You already use ${escapeHtml(bName)} or its provider's ecosystem.</li>`;

  const faqText = `${verdict} See the full spec table for SWE-bench, HumanEval, MMLU, context window, and pricing on both.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `${aName} vs ${bName} for coding`,
        description: verdict,
        author: { '@type': 'Organization', name: 'Flowpicker' },
        publisher: { '@type': 'Organization', name: 'Flowpicker', url: `${SITE_BASE}/` },
        datePublished: TODAY,
        dateModified: TODAY,
        mainEntityOfPage: canonical,
      },
      {
        '@type': 'FAQPage',
        mainEntity: [{
          '@type': 'Question',
          name: `${aName} vs ${bName}: which is better for coding?`,
          acceptedAnswer: { '@type': 'Answer', text: faqText },
        }],
      },
    ],
  };

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
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escapeHtml(aName)} vs ${escapeHtml(bName)} for coding (2026)" />
  <meta property="og:description" content="${escapeHtml(verdict)}" />
  <meta property="og:image" content="${SITE_BASE}/og-image.png" />
  <meta property="og:site_name" content="Flowpicker" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(aName)} vs ${escapeHtml(bName)} (2026)" />
  <meta name="twitter:description" content="${escapeHtml(verdict)}" />
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
        <a href="../../leaderboard.html">Leaderboard</a>
        <a href="../../saved.html">Saved</a>
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

    <p class="seo-breadcrumb"><a href="../../">Home</a> › <a href="../../compare.html">Compare</a> › ${escapeHtml(aName)} vs ${escapeHtml(bName)}</p>

    <section class="seo-hero">
      <h1>${escapeHtml(aName)} vs ${escapeHtml(bName)} for coding</h1>
      <p><strong>${escapeHtml(verdict)}</strong> Below: a side-by-side spec table and exactly when to pick each.</p>
    </section>

    <section class="seo-section">
      <h2>At a glance</h2>
      <table class="seo-compare-table">
        <thead>
          <tr><th>Spec</th><th>${escapeHtml(aName)}</th><th>${escapeHtml(bName)}</th></tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </section>

    <section class="seo-section">
      <h2>Pick ${escapeHtml(aName)} if…</h2>
      <ul>
${liA}
      </ul>
      <h2>Pick ${escapeHtml(bName)} if…</h2>
      <ul>
${liB}
      </ul>
    </section>

    <section class="seo-section">
      <h2>${escapeHtml(aName)} vs ${escapeHtml(bName)}: which is better for coding?</h2>
      <p>${escapeHtml(faqText)} Benchmarks are a directional signal, not a guarantee for your codebase — the most reliable test is running both on a real task you care about.</p>
    </section>

    <div class="seo-cta">
      <p class="seo-cta-text">Compare these head-to-head with live data, or build a full stack around your pick — Flowpicker shows compatibility and monthly cost.</p>
      <a class="seo-cta-link" href="../../compare.html#cmp=llm:${escapeHtml(a.id)},llm:${escapeHtml(b.id)}">Open the live comparison →</a>
    </div>

    <section class="seo-section">
      <h2>More comparisons</h2>
      <p><a href="../../leaderboard.html">See the full model leaderboard</a> ranked by SWE-bench, HumanEval, and MMLU.</p>
    </section>

    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </main>

  <footer class="site-footer">
    <span>Flowpicker — AI coding stack builder. Pick, compare, and share your AI coding workflow.</span>
    <div class="site-footer-links">
      <a href="https://github.com/yxxTries" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="mailto:amil.shahul777@gmail.com">Email</a>
    </div>
  </footer>

  <script>window.App = { features: {} };</script>
  <script src="../../src/features/darkmode/darkmode.js"></script>
  <script src="../../src/features/browse-menu/browse-menu-preview.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.App && App.features.darkmode) App.features.darkmode.init();
    });
  </script>
</body>
</html>
`;
}

function cap(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

// Hub page linking to every generated comparison, so none are orphaned. Grouped
// by anchor model for scannability.
function indexHtml(models, written) {
  const canonical = `${SITE_BASE}/vs/`;
  const title = 'AI coding model comparisons — every X vs Y matchup (2026)';
  const description = 'Side-by-side comparisons of AI coding models: SWE-bench, HumanEval, MMLU, context window, and price for every popular matchup.';

  const cards = written
    .map(({ a, b, dirSlug }) => `        <a class="seo-card" href="${escapeHtml(dirSlug)}/">
          <p class="seo-card-title">${escapeHtml(a.name)} vs ${escapeHtml(b.name)}</p>
          <p class="seo-card-desc">Benchmarks, context window, and price compared.</p>
        </a>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE_BASE}/og-image.png" />
  <meta property="og:site_name" content="Flowpicker" />
  <meta name="twitter:card" content="summary_large_image" />

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
        <a href="../leaderboard.html">Leaderboard</a>
        <a href="../saved.html">Saved</a>
      </nav>
      <button type="button" id="dark-mode-toggle" class="dark-mode-toggle" aria-label="Toggle dark mode">🌙</button>
    </header>

    <p class="seo-breadcrumb"><a href="../">Home</a> › <a href="../compare.html">Compare</a> › All matchups</p>

    <section class="seo-hero">
      <h1>AI coding model comparisons</h1>
      <p>Every popular "X vs Y" matchup, compared on SWE-bench, HumanEval, MMLU, context window, and price — with a clear verdict on each. Want a matchup that isn't here? <a href="../compare.html">Build any comparison live</a>.</p>
    </section>

    <section class="seo-section">
      <div class="seo-card-grid">
${cards}
      </div>
    </section>

    <div class="seo-cta">
      <p class="seo-cta-text">Prefer a ranked view? See every model on one leaderboard.</p>
      <a class="seo-cta-link" href="../leaderboard.html">Open the leaderboard →</a>
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
}

// Existing slugs in /compare we must not duplicate (compare key by sorted pair too).
function existingCompareSlugs() {
  if (!fs.existsSync(COMPARE_DIR)) return new Set();
  return new Set(fs.readdirSync(COMPARE_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace(/\.html$/, '')));
}

(function main() {
  const models = loadModels();
  const existing = existingCompareSlugs();

  // Build the matchup set: every challenger × every anchor (when both exist and differ),
  // de-duplicated by unordered pair.
  const pairs = new Map();
  const candidates = [...new Set([...ANCHORS, ...CHALLENGERS])];
  for (const anchor of ANCHORS) {
    for (const other of candidates) {
      if (anchor === other) continue;
      if (!models.has(anchor) || !models.has(other)) continue;
      const key = [anchor, other].sort().join('|');
      if (!pairs.has(key)) pairs.set(key, [anchor, other]);
    }
  }

  const written = [];
  let skipped = 0;
  for (const [, [idA, idB]] of pairs) {
    const a = models.get(idA), b = models.get(idB);
    const dirSlug = `${slug(a.id)}-vs-${slug(b.id)}`;
    const altSlug = `${slug(b.id)}-vs-${slug(a.id)}`;
    // Skip if a hand-authored /compare page already targets this pair.
    if (existing.has(dirSlug) || existing.has(altSlug)) { skipped++; continue; }
    const outDir = path.join(OUT_DIR, dirSlug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), pageHtml(a, b), 'utf8');
    written.push({ a, b, dirSlug });
  }

  // Sort hub cards by combined SWE-bench so the strongest matchups surface first.
  written.sort((x, y) =>
    (parsePercent(y.a.sweBench) || 0) + (parsePercent(y.b.sweBench) || 0)
    - ((parsePercent(x.a.sweBench) || 0) + (parsePercent(x.b.sweBench) || 0)));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml(models, written), 'utf8');

  console.log(`Wrote ${written.length} vs-pages + hub under ${OUT_DIR} (${skipped} skipped as already hand-authored).`);
})();
